import { Router, Response } from 'express';
import mongoose from 'mongoose';
import Coupon, { ICoupon } from '../models/Coupon';
import { ApiResponse } from '../utils/response';
import { verifyToken, verifyAdmin, AuthenticatedRequest } from '../middleware/auth';
// Removed redundant import
import crypto from 'crypto';
import Joi from 'joi';

const router = Router();

// ============================================================
// JOI SCHEMAS
// ============================================================
const validateCouponSchema = Joi.object({
  code: Joi.string().required().trim(),
  orderAmount: Joi.number().required().min(0),
  cartItems: Joi.array().items(Joi.object({
    productId: Joi.string().required(),
    categoryId: Joi.string().optional(),
    price: Joi.number().required().min(0),
    qty: Joi.number().required().min(1),
  })).optional().default([]),
});

const applyCouponSchema = Joi.object({
  code: Joi.string().required().trim(),
  orderId: Joi.string().optional(),
  orderAmount: Joi.number().required().min(0),
  cartItems: Joi.array().items(Joi.object({
    productId: Joi.string().required(),
    categoryId: Joi.string().optional(),
    price: Joi.number().required().min(0),
    qty: Joi.number().required().min(1),
  })).optional().default([]),
});

const adminCreateCouponSchema = Joi.object({
  email: Joi.string().email().optional(),
  discountType: Joi.string().valid('percentage', 'fixed').optional(),
  discountValue: Joi.number().min(0).optional(),
  minOrderAmount: Joi.number().min(0).optional(),
  maxDiscount: Joi.number().min(0).optional(),
  expiresInDays: Joi.number().integer().min(1).optional(),
  source: Joi.string().optional(),
  maxUses: Joi.number().integer().min(0).optional(),
  categoryRestrictions: Joi.array().items(Joi.string()).optional(),
});

/**
 * Generate a unique, unambiguous coupon code
 * Removes confusing characters: 0/O, 1/I/L, 5/S, 2/Z
 */
function generateUniqueCode(prefix: string = 'MS'): string {
    const chars = 'ABCDEFGHJKMNPQRTUVWXY346789'; // unambiguous chars only
    let code = prefix;
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Add a short hash for extra uniqueness
    const hash = crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 2);
    return code + hash;
}

/**
 * CartItem shape expected when validating a coupon with category restrictions.
 */
interface CartItem {
    productId: string;
    categoryId?: string;
    price: number;
    qty: number;
}

/**
 * Core coupon validation algorithm (Req 12.1–12.6).
 *
 * Validates existence, expiry, maxUses, minOrderAmount, and computes the
 * discountAmount respecting category restrictions, percentage vs fixed type,
 * maxDiscount cap, and orderAmount cap.
 *
 * Returns { valid: true, discountAmount } on success or
 *         { valid: false, reason } on any validation failure.
 */
function computeCouponDiscount(
    coupon: ICoupon,
    orderAmount: number,
    cartItems: CartItem[]
): { valid: true; discountAmount: number } | { valid: false; reason: string } {
    const now = new Date();

    // Req 12.1 — expiry check
    if (coupon.expiresAt < now) {
        return { valid: false, reason: 'Coupon has expired' };
    }

    // Req 12.2 — maxUses / usageCount check
    if (coupon.maxUses > 0 && coupon.usageCount >= coupon.maxUses) {
        return { valid: false, reason: 'Coupon maximum uses reached' };
    }

    // Req 12.1 — minimum order amount check
    if (orderAmount < coupon.minOrderAmount) {
        return { valid: false, reason: `Minimum order amount of ₹${coupon.minOrderAmount} not met` };
    }

    // Req 12.3 — category restriction: compute effectiveAmount
    let effectiveAmount: number;
    const restrictions = coupon.categoryRestrictions ?? [];
    if (restrictions.length > 0) {
        const eligibleItems = cartItems.filter(
            (item) => item.categoryId && restrictions.includes(item.categoryId)
        );
        effectiveAmount = eligibleItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    } else {
        effectiveAmount = orderAmount;
    }

    // Req 12.1 — percentage vs fixed discount
    let rawDiscount: number;
    if (coupon.discountType === 'percentage') {
        rawDiscount = effectiveAmount * (coupon.discountValue / 100);
    } else {
        rawDiscount = coupon.discountValue;
    }

    // Cap by maxDiscount (0 = no cap)
    let discountAmount: number;
    if (coupon.maxDiscount > 0) {
        discountAmount = Math.min(rawDiscount, coupon.maxDiscount);
    } else {
        discountAmount = rawDiscount;
    }

    // Cap by orderAmount — discount can never exceed what the customer owes
    discountAmount = Math.min(discountAmount, orderAmount);

    return { valid: true, discountAmount: Math.round(discountAmount * 100) / 100 };
}

/**
 * Validate a coupon code (authenticated)
 * POST /api/coupons/validate
 *
 * Body:
 *   code        {string}     — coupon code to validate
 *   orderAmount {number}     — total cart value before discount
 *   cartItems   {CartItem[]} — optional; required for category-restricted coupons
 *
 * Returns HTTP 400 with a descriptive message for every validation failure (Req 12.6).
 */
router.post('/validate', verifyToken, async (req: any, res: Response) => {
    try {
        const authReq = req as AuthenticatedRequest;

        const { error, value } = validateCouponSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { code, orderAmount: parsedOrderAmount, cartItems } = value;

        // Req 12.1 — existence check
        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
        if (!coupon) {
            return res.status(400).json(new ApiResponse(false, 'Invalid coupon code', null, 400));
        }

        // Newsletter coupon ownership check (pre-existing business rule)
        if (coupon.source === 'newsletter') {
            if (authReq.user && coupon.email.toLowerCase() !== authReq.user.email.toLowerCase()) {
                return res.status(400).json(new ApiResponse(false, 'This coupon code belongs to another account', null, 400));
            }

            if (authReq.user) {
                const usedNewsletterCoupon = await Coupon.findOne({
                    userId: authReq.user.userId,
                    source: 'newsletter',
                    isUsed: true,
                });
                if (usedNewsletterCoupon) {
                    return res.status(400).json(
                        new ApiResponse(false, 'You have already used a newsletter coupon (only 1 allowed per account)', null, 400)
                    );
                }
            }
        }

        // Run the core validation algorithm (Req 12.1–12.3)
        const result = computeCouponDiscount(coupon, parsedOrderAmount, cartItems as CartItem[]);

        if (!result.valid) {
            return res.status(400).json(new ApiResponse(false, result.reason, null, 400));
        }

        return res.status(200).json(
            new ApiResponse(true, 'Coupon is valid', {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                maxDiscount: coupon.maxDiscount,
                minOrderAmount: coupon.minOrderAmount,
                categoryRestrictions: coupon.categoryRestrictions ?? [],
                discountAmount: result.discountAmount,
            })
        );
    } catch (error: any) {
        return res.status(500).json(new ApiResponse(false, error.message || 'Failed to validate coupon', null, 500));
    }
});

/**
 * Apply coupon (run full validation, mark as used, and increment usageCount) — called during order placement
 * POST /api/coupons/apply
 *
 * Body:
 *   code        {string}     — coupon code to apply
 *   orderId     {string}     — optional order ID being created
 *   orderAmount {number}     — total cart value before discount
 *   cartItems   {CartItem[]} — optional; required for category-restricted coupons
 *
 * Runs the full validation algorithm (Req 12.1–12.6) and increments usageCount (Req 12.2).
 */
router.post('/apply', verifyToken, async (req: any, res: Response) => {
    try {
        const authReq = req as AuthenticatedRequest;

        const { error: bodyError, value } = applyCouponSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (bodyError) {
            return res.status(400).json({ success: false, message: bodyError.details[0].message });
        }

        const { code, orderId, orderAmount, cartItems } = value;

        // Req 12.1 — existence check
        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
        if (!coupon) {
            return res.status(400).json(new ApiResponse(false, 'Invalid coupon code', null, 400));
        }

        // Newsletter coupon ownership check (pre-existing business rule)
        if (coupon.source === 'newsletter') {
            if (authReq.user && coupon.email.toLowerCase() !== authReq.user.email.toLowerCase()) {
                return res.status(400).json(new ApiResponse(false, 'This 10% off code belongs to another account', null, 400));
            }

            if (authReq.user) {
                const usedNewsletterCoupon = await Coupon.findOne({
                    userId: authReq.user.userId,
                    source: 'newsletter',
                    isUsed: true,
                });
                if (usedNewsletterCoupon) {
                    return res.status(400).json(
                        new ApiResponse(false, 'You have already used a 10% off welcome code (only 1 allowed per user in a lifetime)', null, 400)
                    );
                }
            }
        }

        // Req 12.1–12.3 — run full validation algorithm before persisting redemption
        const validationResult = computeCouponDiscount(coupon, orderAmount, cartItems as CartItem[]);
        if (!validationResult.valid) {
            return res.status(400).json(new ApiResponse(false, validationResult.reason, null, 400));
        }

        // Req 12.2 — increment usageCount on every successful redemption
        coupon.isUsed = true;
        coupon.usedAt = new Date();
        coupon.usageCount = (coupon.usageCount ?? 0) + 1;
        if (orderId && typeof orderId === 'string' && orderId.length > 0) {
            coupon.usedOrderId = new mongoose.Types.ObjectId(orderId);
        }
        if (authReq.user?.userId) {
            coupon.userId = new mongoose.Types.ObjectId(authReq.user.userId);
        }
        await coupon.save();

        return res.status(200).json(
            new ApiResponse(true, 'Coupon applied successfully', {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                maxDiscount: coupon.maxDiscount,
                minOrderAmount: coupon.minOrderAmount,
                categoryRestrictions: coupon.categoryRestrictions ?? [],
                usageCount: coupon.usageCount,
                discountAmount: validationResult.discountAmount,
            })
        );
    } catch (error: any) {
        return res.status(500).json(new ApiResponse(false, error.message || 'Failed to apply coupon', null, 500));
    }
});

/**
 * Admin: Get all coupons
 */
router.get('/admin/all', verifyToken, verifyAdmin, async (req: any, res: Response) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const query: any = {};
        if (status === 'used') query.isUsed = true;
        if (status === 'unused') query.isUsed = false;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const coupons = await Coupon.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit as string));

        const total = await Coupon.countDocuments(query);

        res.status(200).json(new ApiResponse(true, 'Coupons fetched', {
            coupons,
            pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string) },
        }));
    } catch (error: any) {
        res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch coupons', null, 500));
    }
});

/**
 * Admin: Create a custom coupon
 */
router.post('/admin/create', verifyToken, verifyAdmin, async (req: any, res: Response) => {
    try {
        const { error, value } = adminCreateCouponSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const {
            email,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscount,
            expiresInDays,
            source,
            maxUses,
            categoryRestrictions,
        } = value;

        const code = generateUniqueCode('MSVIP');

        const couponData: Record<string, unknown> = {
            code,
            email: email || 'admin@matasreesuper.com',
            discountType: discountType || 'percentage',
            discountValue: discountValue || 10,
            minOrderAmount: minOrderAmount || 0,
            maxDiscount: maxDiscount || 0,
            maxUses: maxUses || 0,
            expiresAt: new Date(Date.now() + (expiresInDays || 30) * 24 * 60 * 60 * 1000),
            source: source || 'admin',
        };

        // Only set categoryRestrictions when explicitly provided (Req 12.3)
        if (Array.isArray(categoryRestrictions) && categoryRestrictions.length > 0) {
            couponData.categoryRestrictions = categoryRestrictions;
        }

        const coupon = await Coupon.create(couponData);

        return res.status(201).json(new ApiResponse(true, 'Coupon created', coupon));
    } catch (error: any) {
        return res.status(500).json(new ApiResponse(false, error.message || 'Failed to create coupon', null, 500));
    }
});

export { generateUniqueCode };
// New route: Generate a unique newsletter coupon for a user (10% off, one-time use)
router.post('/newsletter/generate', verifyToken, async (req: any, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userEmail = authReq.user?.email?.toLowerCase();
    if (!userEmail) {
      return res.status(400).json(new ApiResponse(false, 'User email not found', null, 400));
    }
    // Check if a newsletter coupon already exists for this email
    const existingCoupon = await Coupon.findOne({ email: userEmail, source: 'newsletter' }).sort({ createdAt: -1 });
    if (existingCoupon) {
      if (existingCoupon.isUsed) {
        return res.status(400).json(new ApiResponse(false, 'You have already used a newsletter coupon', null, 400));
      } else {
        return res.status(200).json(new ApiResponse(true, 'Existing newsletter coupon', { code: existingCoupon.code }));
      }
    }
    // Create new coupon
    const code = generateUniqueCode('MSNEWS');
    const newCoupon = await Coupon.create({
      code,
      email: userEmail,
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      source: 'newsletter',
    });
    return res.status(201).json(new ApiResponse(true, 'Newsletter coupon generated', { code: newCoupon.code }));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to generate newsletter coupon', null, 500));
  }
});

export default router;
