import express, { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import Joi from 'joi';
import Coupon from '../models/Coupon';
import User from '../models/User';
import { generateUniqueCode } from './couponRoutes';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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

// Subscribe to newsletter — requires login, uses logged-in user's email ONLY
router.post('/subscribe', verifyToken, async (req: any, res: Response) => {
  try {
    // Get the authenticated user's email from the database (not from request body)
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
      $or: [
        { email: email.toLowerCase() },
        { userId: userId }
      ],
      source: 'newsletter'
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

    // Generate unique code (unambiguous characters only)
    let code: string;
    let attempts = 0;
    do {
      code = generateUniqueCode('MS10');
      attempts++;
    } while (await Coupon.findOne({ code }) && attempts < 5);

    // Create coupon: 10% off, single use, 30-day expiry, max ₹200 discount
    const coupon = await Coupon.create({
      code,
      email: email.toLowerCase(),
      userId: userId, // Ensure coupon is tightly bound to this user
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 199,
      maxDiscount: 200,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      source: 'newsletter',
      isUsed: false,
    });

    // Send welcome email to CUSTOMER with their unique coupon code
    const welcomeMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🎉 Welcome to Matasree Super - Your Exclusive 10% Discount Code Inside!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #d4641f 0%, #dc851f 100%); padding: 40px 20px; border-radius: 10px; }
            .header { text-align: center; color: white; margin-bottom: 30px; }
            .header h1 { font-size: 28px; margin: 0; font-family: 'Georgia', serif; }
            .content { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
            .discount-code { background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; font-size: 28px; font-weight: bold; letter-spacing: 4px; font-family: 'Courier New', monospace; }
            .code-note { text-align: center; font-size: 12px; color: #888; margin-top: -15px; margin-bottom: 15px; }
            .features { margin: 20px 0; }
            .feature { margin: 15px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #d4641f; border-radius: 4px; }
            .feature h3 { margin: 0 0 5px 0; color: #d4641f; }
            .feature p { margin: 0; color: #666; font-size: 14px; }
            .cta { text-align: center; margin: 30px 0; }
            .cta-button { background: linear-gradient(135deg, #d4641f 0%, #dc851f 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; }
            .terms { background: #fff3cd; border: 1px solid #ffc107; padding: 12px 15px; border-radius: 6px; font-size: 12px; color: #856404; margin: 15px 0; }
            .footer { text-align: center; color: white; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Matasree Super!</h1>
              <p>Premium Indian Masalas Since 1985</p>
            </div>
            
            <div class="content">
              <p>Hello ${name || 'Valued Customer'},</p>
              
              <p>Thank you for subscribing! Here is your <strong>exclusive, one-time</strong> discount code:</p>
              
              <div class="discount-code">
                ${coupon.code}
              </div>
              <p class="code-note">⚠️ This code is unique to you and can only be used once</p>
              
              <p style="color: #d4641f; font-weight: bold; text-align: center; font-size: 18px;">
                Get <strong>10% OFF</strong> your first order (up to ₹200)!
              </p>

              <div class="terms">
                <strong>Terms:</strong>
                <ul style="margin: 5px 0; padding-left: 15px;">
                  <li>Valid for one-time use only</li>
                  <li>Minimum order: ₹199</li>
                  <li>Maximum discount: ₹200</li>
                  <li>Expires in 30 days (${new Date(coupon.expiresAt).toLocaleDateString('en-IN')})</li>
                  <li>Cannot be combined with other offers</li>
                </ul>
              </div>
              
              <div class="features">
                <div class="feature">
                  <h3>✓ 100% Pure & Natural</h3>
                  <p>No additives, no fillers - just authentic spices</p>
                </div>
                <div class="feature">
                  <h3>✓ Stone Ground Fresh</h3>
                  <p>Traditional grinding preserves aroma and potency</p>
                </div>
                <div class="feature">
                  <h3>✓ 40+ Years of Trust</h3>
                  <p>Family legacy of excellence since 1985</p>
                </div>
              </div>
              
              <div class="cta">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:8000'}/products" class="cta-button">Shop Now & Use Your Code →</a>
              </div>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Matasree Super. All rights reserved.</p>
              <p>Clement Town, Dehradun | Serving families across India</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Send notification email to ADMIN
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: '📧 New Newsletter Subscriber + Coupon Generated',
      html: `
        <h2>New Newsletter Subscriber</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Coupon Code:</strong> ${coupon.code}</p>
        <p><strong>Discount:</strong> 10% (max ₹200)</p>
        <p><strong>Expires:</strong> ${new Date(coupon.expiresAt).toLocaleDateString('en-IN')}</p>
        <p><strong>Subscribed at:</strong> ${new Date().toLocaleString()}</p>
      `,
    };

    // Send BOTH emails ASYNCHRONOUSLY (don't block response)
    // Fire and forget - user gets coupon immediately, emails send in background
    console.log(`📧 Sending newsletter emails...`);
    console.log(`   ✉️  TO CUSTOMER: ${email}`);
    console.log(`   ✉️  TO ADMIN: ${process.env.ADMIN_EMAIL || process.env.EMAIL_USER}`);
    console.log(`   💝 Coupon Code: ${coupon.code}`);
    
    Promise.all([
      transporter.sendMail(welcomeMailOptions).then(info => {
        console.log(`✅ Welcome email sent to ${email}`);
        console.log(`   Message ID: ${info.messageId}`);
        return info;
      }).catch(err => {
        console.error(`❌ Failed to send welcome email to ${email}:`, err.message);
        return null;
      }),
      transporter.sendMail(adminMailOptions).then(info => {
        console.log(`✅ Admin notification sent`);
        console.log(`   Message ID: ${info.messageId}`);
        return info;
      }).catch(err => {
        console.error(`❌ Failed to send admin notification:`, err.message);
        return null;
      }),
    ]).catch(err => console.error('Email sending error:', err));

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed! Check your email for your exclusive discount code. 🎉',
      email: email,
      code: coupon.code, // include the code!
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to subscribe. Please try again later.',
    });
  }
});

// Contact form email
router.post('/contact', async (req: Request, res: Response) => {
  try {
    const { error, value } = contactSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { name, email, subject, message, phone } = value;

    const contactMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `New Contact Form: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; }
            .header { background: linear-gradient(135deg, #d4641f 0%, #dc851f 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
            .field { margin: 15px 0; padding: 10px; background: #f9fafb; border-radius: 4px; }
            .field-label { color: #d4641f; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Contact Form Submission</h2>
            </div>
            
            <div class="content">
              <div class="field">
                <p class="field-label">Name:</p>
                <p>${name}</p>
              </div>
              
              <div class="field">
                <p class="field-label">Email:</p>
                <p>${email}</p>
              </div>
              
              <div class="field">
                <p class="field-label">Phone:</p>
                <p>${phone || 'Not provided'}</p>
              </div>
              
              <div class="field">
                <p class="field-label">Subject:</p>
                <p>${subject}</p>
              </div>
              
              <div class="field">
                <p class="field-label">Message:</p>
                <p>${message.replace(/\n/g, '<br>')}</p>
              </div>
              
              <hr>
              <p style="color: #999; font-size: 12px; margin-top: 20px;">
                Submitted on: ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const replyMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'We received your message - Matasree Super',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #d4641f 0%, #dc851f 100%); padding: 40px 20px; border-radius: 10px; }
            .header { text-align: center; color: white; margin-bottom: 30px; }
            .content { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
            .footer { text-align: center; color: white; font-size: 12px; margin-top: 20px; }
            .button { background: #d4641f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Contacting Us!</h1>
              <p>Matasree Super Team</p>
            </div>
            
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>We've received your message and really appreciate you reaching out to us. Our team typically responds within 24 hours.</p>
              
              <p><strong>Your Subject:</strong> ${subject}</p>
              
              <p>In the meantime, if you have any urgent questions, feel free to call us or visit our website.</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8000'}/contact" class="button">Visit Our Website</a>
              
              <p>Best regards,<br><strong>Matasree Super Team</strong></p>
              
              <hr>
              <p style="color: #999; font-size: 12px;">If you didn't send this message, please ignore this email.</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Matasree Super. All rights reserved.</p>
              <p>Old Delhi, India | +91 98765 43210</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Send both emails ASYNCHRONOUSLY (don't block response)
    Promise.all([
      transporter.sendMail(contactMailOptions).catch(err =>
        console.error('Failed to send contact email:', err.message)
      ),
      transporter.sendMail(replyMailOptions).catch(err =>
        console.error('Failed to send reply email:', err.message)
      ),
    ]).catch(err => console.error('Email sending error:', err));

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

export default router;
