"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const Coupon_1 = __importDefault(require("../models/Coupon"));
const User_1 = __importDefault(require("../models/User"));
const couponRoutes_1 = require("./couponRoutes");
const auth_1 = require("../middleware/auth");
const captcha_1 = require("../middleware/captcha");
const response_1 = require("../utils/response");
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
// Contact form Joi validation schema
const contactSchema = joi_1.default.object({
    name: joi_1.default.string().trim().min(2).max(100).required(),
    email: joi_1.default.string().email().lowercase().required(),
    subject: joi_1.default.string().trim().min(3).max(100).required(),
    message: joi_1.default.string().trim().min(5).max(5000).required(),
    phone: joi_1.default.string()
        .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
        .optional()
        .allow(''),
});
// Support Reply Schema
const supportReplySchema = joi_1.default.object({
    email: joi_1.default.string().email().lowercase().required(),
    name: joi_1.default.string().trim().required(),
    originalSubject: joi_1.default.string().trim().required(),
    replyMessage: joi_1.default.string().trim().min(5).max(5000).required(),
});
/**
 * Subscribe to newsletter — requires login, uses logged-in user's email ONLY
 */
router.post('/subscribe', auth_1.verifyToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Please login first' });
        }
        const dbUser = await User_1.default.findById(userId);
        if (!dbUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const email = dbUser.email.toLowerCase();
        const name = dbUser.name || req.body.name || 'Valued Customer';
        // Check if this user or email already has a newsletter coupon
        const existingCoupon = await Coupon_1.default.findOne({
            $or: [{ email: email.toLowerCase() }, { userId: userId }],
            source: 'newsletter',
        });
        if (existingCoupon) {
            if (existingCoupon.isUsed) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already used a newsletter coupon',
                });
            }
            return res.status(200).json({
                success: true,
                message: 'You have already generated your 10% off code!',
                code: existingCoupon.code,
            });
        }
        // Generate unique code
        let code;
        let attempts = 0;
        do {
            code = (0, couponRoutes_1.generateUniqueCode)('MS10');
            attempts++;
        } while ((await Coupon_1.default.findOne({ code })) && attempts < 5);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        // Create coupon
        const coupon = await Coupon_1.default.create({
            code,
            email: email.toLowerCase(),
            userId: userId,
            discountType: 'percentage',
            discountValue: 10,
            minOrderAmount: 199,
            maxDiscount: 200,
            expiresAt,
            source: 'newsletter',
            isUsed: false,
        });
        // Send emails asynchronously
        Promise.all([
            (0, email_1.sendNewsletterWelcomeEmail)(email, name, coupon.code, 10, 200, 199, expiresAt),
            (0, email_1.sendEmail)({
                email: (0, email_1.getAdminEmail)(),
                subject: '📧 New Newsletter Subscriber + Coupon Generated',
                html: `<h2>New Newsletter Subscriber</h2>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Name:</strong> ${name}</p>
               <p><strong>Coupon:</strong> ${coupon.code}</p>`,
            }),
        ]).catch((err) => console.error('Newsletter email sending error:', err));
        return res.status(200).json({
            success: true,
            message: 'Successfully subscribed! Check your email for your exclusive discount code. 🎉',
            email: email,
            code: coupon.code,
        });
    }
    catch (error) {
        console.error('Newsletter subscription error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to subscribe. Please try again later.',
        });
    }
});
/**
 * Contact form email
 */
router.post('/contact', captcha_1.verifyCaptcha, async (req, res) => {
    try {
        const { error, value } = contactSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { name, email, subject, message, phone } = value;
        // Send both customer auto-reply and admin notification asynchronously
        Promise.all([
            (0, email_1.sendContactReceiptEmail)(email, name, subject),
            (0, email_1.sendAdminContactAlertEmail)({ name, email, subject, message, phone }),
        ]).catch((err) => console.error('Contact email error:', err));
        return res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully! We will get back to you soon.',
        });
    }
    catch (error) {
        console.error('Contact form error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.',
        });
    }
});
/**
 * Customer Support Reply (Admin only)
 */
router.post('/reply', auth_1.verifyToken, auth_1.verifyAdmin, async (req, res) => {
    try {
        const { error, value } = supportReplySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { email, name, originalSubject, replyMessage } = value;
        const sent = await (0, email_1.sendCustomerSupportReplyEmail)(email, name, originalSubject, replyMessage);
        if (sent) {
            return res.status(200).json(new response_1.ApiResponse(true, 'Customer support reply sent successfully'));
        }
        else {
            return res.status(500).json(new response_1.ApiResponse(false, 'Failed to send customer support reply email'));
        }
    }
    catch (error) {
        console.error('Support reply error:', error);
        return res.status(500).json(new response_1.ApiResponse(false, 'Error processing support reply'));
    }
});
exports.default = router;
//# sourceMappingURL=emailRoutes.js.map