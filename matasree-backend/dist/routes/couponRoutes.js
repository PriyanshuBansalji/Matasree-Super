"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueCode = generateUniqueCode;
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const Coupon_1 = __importDefault(require("../models/Coupon"));
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
// Removed redundant import
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
/**
 * Generate a unique, unambiguous coupon code
 * Removes confusing characters: 0/O, 1/I/L, 5/S, 2/Z
 */
function generateUniqueCode(prefix = 'MS') {
    const chars = 'ABCDEFGHJKMNPQRTUVWXY346789'; // unambiguous chars only
    let code = prefix;
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Add a short hash for extra uniqueness
    const hash = crypto_1.default.randomBytes(2).toString('hex').toUpperCase().slice(0, 2);
    return code + hash;
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
function computeCouponDiscount(coupon, orderAmount, cartItems) {
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
    let effectiveAmount;
    const restrictions = coupon.categoryRestrictions ?? [];
    if (restrictions.length > 0) {
        const eligibleItems = cartItems.filter((item) => item.categoryId && restrictions.includes(item.categoryId));
        effectiveAmount = eligibleItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    }
    else {
        effectiveAmount = orderAmount;
    }
    // Req 12.1 — percentage vs fixed discount
    let rawDiscount;
    if (coupon.discountType === 'percentage') {
        rawDiscount = effectiveAmount * (coupon.discountValue / 100);
    }
    else {
        rawDiscount = coupon.discountValue;
    }
    // Cap by maxDiscount (0 = no cap)
    let discountAmount;
    if (coupon.maxDiscount > 0) {
        discountAmount = Math.min(rawDiscount, coupon.maxDiscount);
    }
    else {
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
router.post('/validate', auth_1.verifyToken, async (req, res) => {
    try {
        const authReq = req;
        const { code, orderAmount, cartItems = [] } = req.body;
        if (!code || typeof code !== 'string') {
            return res.status(400).json(new response_1.ApiResponse(false, 'Coupon code is required', null, 400));
        }
        const parsedOrderAmount = parseFloat(orderAmount) || 0;
        // Req 12.1 — existence check
        const coupon = await Coupon_1.default.findOne({ code: code.toUpperCase().trim() });
        if (!coupon) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid coupon code', null, 400));
        }
        // Newsletter coupon ownership check (pre-existing business rule)
        if (coupon.source === 'newsletter') {
            if (authReq.user && coupon.email.toLowerCase() !== authReq.user.email.toLowerCase()) {
                return res.status(400).json(new response_1.ApiResponse(false, 'This coupon code belongs to another account', null, 400));
            }
            if (authReq.user) {
                const usedNewsletterCoupon = await Coupon_1.default.findOne({
                    userId: authReq.user.userId,
                    source: 'newsletter',
                    isUsed: true,
                });
                if (usedNewsletterCoupon) {
                    return res.status(400).json(new response_1.ApiResponse(false, 'You have already used a newsletter coupon (only 1 allowed per account)', null, 400));
                }
            }
        }
        // Run the core validation algorithm (Req 12.1–12.3)
        const result = computeCouponDiscount(coupon, parsedOrderAmount, cartItems);
        if (!result.valid) {
            return res.status(400).json(new response_1.ApiResponse(false, result.reason, null, 400));
        }
        return res.status(200).json(new response_1.ApiResponse(true, 'Coupon is valid', {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            maxDiscount: coupon.maxDiscount,
            minOrderAmount: coupon.minOrderAmount,
            categoryRestrictions: coupon.categoryRestrictions ?? [],
            discountAmount: result.discountAmount,
        }));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to validate coupon', null, 500));
    }
});
/**
 * Apply coupon (mark as used) — called during order placement
 * POST /api/coupons/apply
 */
router.post('/apply', auth_1.verifyToken, async (req, res) => {
    try {
        const authReq = req;
        const { code, orderId } = req.body;
        const coupon = await Coupon_1.default.findOne({ code: code.toUpperCase().trim() });
        if (!coupon) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Invalid coupon code', null, 404));
        }
        if (coupon.isUsed) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Coupon already used', null, 400));
        }
        // Newsletter coupon lifetime limits
        if (coupon.source === 'newsletter') {
            if (authReq.user && coupon.email.toLowerCase() !== authReq.user.email.toLowerCase()) {
                return res.status(400).json(new response_1.ApiResponse(false, 'This 10% off code belongs to another account', null, 400));
            }
            if (authReq.user) {
                const usedNewsletterCoupon = await Coupon_1.default.findOne({
                    userId: authReq.user.userId,
                    source: 'newsletter',
                    isUsed: true
                });
                if (usedNewsletterCoupon) {
                    return res.status(400).json(new response_1.ApiResponse(false, 'You have already used a 10% off welcome code (only 1 allowed per user in a lifetime)', null, 400));
                }
            }
        }
        if (new Date() > coupon.expiresAt) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Coupon expired', null, 400));
        }
        coupon.isUsed = true;
        coupon.usedAt = new Date();
        if (orderId && typeof orderId === 'string' && orderId.length > 0) {
            coupon.usedOrderId = new mongoose_1.default.Types.ObjectId(orderId);
        }
        if (authReq.user?.userId) {
            coupon.userId = new mongoose_1.default.Types.ObjectId(authReq.user.userId);
        }
        await coupon.save();
        return res.status(200).json(new response_1.ApiResponse(true, 'Coupon applied successfully', coupon));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to apply coupon', null, 500));
    }
});
/**
 * Admin: Get all coupons
 */
router.get('/admin/all', auth_1.verifyToken, auth_1.verifyAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const query = {};
        if (status === 'used')
            query.isUsed = true;
        if (status === 'unused')
            query.isUsed = false;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const coupons = await Coupon_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        const total = await Coupon_1.default.countDocuments(query);
        res.status(200).json(new response_1.ApiResponse(true, 'Coupons fetched', {
            coupons,
            pagination: { total, page: parseInt(page), limit: parseInt(limit) },
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch coupons', null, 500));
    }
});
/**
 * Admin: Create a custom coupon
 */
router.post('/admin/create', auth_1.verifyToken, auth_1.verifyAdmin, async (req, res) => {
    try {
        const { email, discountType, discountValue, minOrderAmount, maxDiscount, expiresInDays, source, maxUses } = req.body;
        const code = generateUniqueCode('MSVIP');
        const coupon = await Coupon_1.default.create({
            code,
            email: email || 'admin@matasreesuper.com',
            discountType: discountType || 'percentage',
            discountValue: discountValue || 10,
            minOrderAmount: minOrderAmount || 0,
            maxDiscount: maxDiscount || 0,
            maxUses: maxUses || 0,
            expiresAt: new Date(Date.now() + (expiresInDays || 30) * 24 * 60 * 60 * 1000),
            source: source || 'admin',
        });
        return res.status(201).json(new response_1.ApiResponse(true, 'Coupon created', coupon));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to create coupon', null, 500));
    }
});
// New route: Generate a unique newsletter coupon for a user (10% off, one-time use)
router.post('/newsletter/generate', auth_1.verifyToken, async (req, res) => {
    try {
        const authReq = req;
        const userEmail = authReq.user?.email?.toLowerCase();
        if (!userEmail) {
            return res.status(400).json(new response_1.ApiResponse(false, 'User email not found', null, 400));
        }
        // Check if a newsletter coupon already exists for this email
        const existingCoupon = await Coupon_1.default.findOne({ email: userEmail, source: 'newsletter' }).sort({ createdAt: -1 });
        if (existingCoupon) {
            if (existingCoupon.isUsed) {
                return res.status(400).json(new response_1.ApiResponse(false, 'You have already used a newsletter coupon', null, 400));
            }
            else {
                return res.status(200).json(new response_1.ApiResponse(true, 'Existing newsletter coupon', { code: existingCoupon.code }));
            }
        }
        // Create new coupon
        const code = generateUniqueCode('MSNEWS');
        const newCoupon = await Coupon_1.default.create({
            code,
            email: userEmail,
            discountType: 'percentage',
            discountValue: 10,
            minOrderAmount: 0,
            maxDiscount: 0,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            source: 'newsletter',
        });
        return res.status(201).json(new response_1.ApiResponse(true, 'Newsletter coupon generated', { code: newCoupon.code }));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to generate newsletter coupon', null, 500));
    }
});
exports.default = router;
//# sourceMappingURL=couponRoutes.js.map