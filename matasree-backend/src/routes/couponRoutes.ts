import { Router, Response } from 'express';
import mongoose from 'mongoose';
import Coupon from '../models/Coupon';
import { ApiResponse } from '../utils/response';
import { verifyToken, verifyAdmin, AuthenticatedRequest } from '../middleware/auth';
// Removed redundant import
import crypto from 'crypto';

const router = Router();

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
 * Validate a coupon code (public, authenticated)
 * POST /api/coupons/validate
 */
router.post('/validate', verifyToken, async (req: any, res: Response) => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { code, orderAmount } = req.body;

        if (!code) {
            return res.status(400).json(new ApiResponse(false, 'Coupon code is required', null, 400));
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

        if (!coupon) {
            return res.status(404).json(new ApiResponse(false, 'Invalid coupon code', null, 404));
        }

        // Check if already used
        if (coupon.isUsed) {
            return res.status(400).json(new ApiResponse(false, 'This coupon has already been used', null, 400));
        }

        // Newsletter coupon lifetime limits
        if (coupon.source === 'newsletter') {
            if (authReq.user && coupon.email.toLowerCase() !== authReq.user.email.toLowerCase()) {
                return res.status(400).json(new ApiResponse(false, 'This 10% off code belongs to another account', null, 400));
            }
            
            if (authReq.user) {
                const usedNewsletterCoupon = await Coupon.findOne({
                    userId: authReq.user.userId,
                    source: 'newsletter',
                    isUsed: true
                });
                
                if (usedNewsletterCoupon) {
                    return res.status(400).json(new ApiResponse(false, 'You have already used a 10% off welcome code (only 1 allowed per user in a lifetime)', null, 400));
                }
            }
        }

        // Check expiry
        if (new Date() > coupon.expiresAt) {
            return res.status(400).json(new ApiResponse(false, 'This coupon has expired', null, 400));
        }

        // Check minimum order amount
        if (orderAmount && coupon.minOrderAmount > 0 && orderAmount < coupon.minOrderAmount) {
            return res.status(400).json(
                new ApiResponse(false, `Minimum order amount is ₹${coupon.minOrderAmount}`, null, 400)
            );
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = orderAmount ? (orderAmount * coupon.discountValue) / 100 : 0;
            if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else {
            discount = coupon.discountValue;
        }

        res.status(200).json(new ApiResponse(true, 'Coupon is valid!', {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            maxDiscount: coupon.maxDiscount,
            minOrderAmount: coupon.minOrderAmount,
            calculatedDiscount: Math.round(discount),
        }));
    } catch (error: any) {
        res.status(500).json(new ApiResponse(false, error.message || 'Failed to validate coupon', null, 500));
    }
});

/**
 * Apply coupon (mark as used) — called during order placement
 * POST /api/coupons/apply
 */
router.post('/apply', verifyToken, async (req: any, res: Response) => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { code, orderId } = req.body;

        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

        if (!coupon) {
            return res.status(404).json(new ApiResponse(false, 'Invalid coupon code', null, 404));
        }

        if (coupon.isUsed) {
            return res.status(400).json(new ApiResponse(false, 'Coupon already used', null, 400));
        }

        // Newsletter coupon lifetime limits
        if (coupon.source === 'newsletter') {
            if (authReq.user && coupon.email.toLowerCase() !== authReq.user.email.toLowerCase()) {
                return res.status(400).json(new ApiResponse(false, 'This 10% off code belongs to another account', null, 400));
            }

            if (authReq.user) {
                const usedNewsletterCoupon = await Coupon.findOne({
                    userId: authReq.user.userId,
                    source: 'newsletter',
                    isUsed: true
                });

                if (usedNewsletterCoupon) {
                    return res.status(400).json(new ApiResponse(false, 'You have already used a 10% off welcome code (only 1 allowed per user in a lifetime)', null, 400));
                }
            }
        }

        if (new Date() > coupon.expiresAt) {
            return res.status(400).json(new ApiResponse(false, 'Coupon expired', null, 400));
        }

        coupon.isUsed = true;
        coupon.usedAt = new Date();
        if (orderId) coupon.usedOrderId = new mongoose.Types.ObjectId(orderId);
        if (authReq.user?.userId) coupon.userId = new mongoose.Types.ObjectId(authReq.user.userId);
        await coupon.save();

        res.status(200).json(new ApiResponse(true, 'Coupon applied successfully', coupon));
    } catch (error: any) {
        res.status(500).json(new ApiResponse(false, error.message || 'Failed to apply coupon', null, 500));
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
        const { email, discountType, discountValue, minOrderAmount, maxDiscount, expiresInDays, source } = req.body;

        const code = generateUniqueCode('MSVIP');

        const coupon = await Coupon.create({
            code,
            email: email || 'admin@matasreesuper.com',
            discountType: discountType || 'percentage',
            discountValue: discountValue || 10,
            minOrderAmount: minOrderAmount || 0,
            maxDiscount: maxDiscount || 0,
            expiresAt: new Date(Date.now() + (expiresInDays || 30) * 24 * 60 * 60 * 1000),
            source: source || 'admin',
        });

        res.status(201).json(new ApiResponse(true, 'Coupon created', coupon));
    } catch (error: any) {
        res.status(500).json(new ApiResponse(false, error.message || 'Failed to create coupon', null, 500));
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
