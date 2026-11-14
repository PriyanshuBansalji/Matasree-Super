import express, { Router, Request, Response } from 'express';
import Joi from 'joi';
import Coupon from '../models/Coupon';
import User from '../models/User';
import { generateUniqueCode } from './couponRoutes';
import { verifyToken, AuthenticatedRequest, verifyAdmin } from '../middleware/auth';
import { verifyCaptcha } from '../middleware/captcha';
import { ApiResponse } from '../utils/response';
import {
  sendNewsletterWelcomeEmail,
  sendAdminContactAlertEmail,
  sendContactReceiptEmail,
  sendCustomerSupportReplyEmail,
  getAdminEmail,
  sendEmail,
} from '../utils/email';

const router = Router();

// Contact form Joi validation schema
const contactSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  subject: Joi.string().trim().min(3).max(100).required(),
  message: Joi.string().trim().min(5).max(5000).required(),
  phone: Joi.string()
    .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .optional()
    .allow(''),
});

// Support Reply Schema
const supportReplySchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  name: Joi.string().trim().required(),
  originalSubject: Joi.string().trim().required(),
  replyMessage: Joi.string().trim().min(5).max(5000).required(),
});

/**
 * Subscribe to newsletter — requires login, uses logged-in user's email ONLY
 */
router.post('/subscribe', verifyToken, async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Please login first' });
    }

    const dbUser = await User.findById(userId);
    if (!dbUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const email = dbUser.email.toLowerCase();
    const name = dbUser.name || req.body.name || 'Valued Customer';

    // Check if this user or email already has a newsletter coupon
    const existingCoupon = await Coupon.findOne({
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
    let code: string;
    let attempts = 0;
    do {
      code = generateUniqueCode('MS10');
      attempts++;
    } while ((await Coupon.findOne({ code })) && attempts < 5);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create coupon
    const coupon = await Coupon.create({
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
      sendNewsletterWelcomeEmail(email, name, coupon.code, 10, 200, 199, expiresAt),
      sendEmail({
        email: getAdminEmail(),
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
  } catch (error) {
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
router.post('/contact', verifyCaptcha, async (req: Request, res: Response) => {
  try {
    const { error, value } = contactSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { name, email, subject, message, phone } = value;

    // Send both customer auto-reply and admin notification asynchronously
    Promise.all([
      sendContactReceiptEmail(email, name, subject),
      sendAdminContactAlertEmail({ name, email, subject, message, phone }),
    ]).catch((err) => console.error('Contact email error:', err));

    return res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.',
    });
  } catch (error) {
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
router.post('/reply', verifyToken, verifyAdmin, async (req: any, res: Response) => {
  try {
    const { error, value } = supportReplySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { email, name, originalSubject, replyMessage } = value;
    const sent = await sendCustomerSupportReplyEmail(email, name, originalSubject, replyMessage);

    if (sent) {
      return res.status(200).json(new ApiResponse(true, 'Customer support reply sent successfully'));
    } else {
      return res.status(500).json(new ApiResponse(false, 'Failed to send customer support reply email'));
    }
  } catch (error) {
    console.error('Support reply error:', error);
    return res.status(500).json(new ApiResponse(false, 'Error processing support reply'));
  }
});

export default router;
