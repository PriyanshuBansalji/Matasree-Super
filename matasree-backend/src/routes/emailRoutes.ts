import express, { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { validationResult, body } from 'express-validator';

const router = Router();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Email validation middleware
const validateEmail = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
];

// Contact form validation middleware
const validateContact = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Subject must be between 3 and 100 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 5, max: 5000 })
    .withMessage('Message must be between 5 and 5000 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number'),
];

// Subscribe to newsletter
router.post('/subscribe', validateEmail, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, name } = req.body;

    // Send welcome email to subscriber
    const welcomeMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🎉 Welcome to Matasree Super - Your 10% Discount Code Inside!',
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
            .discount-code { background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
            .features { margin: 20px 0; }
            .feature { margin: 15px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #d4641f; border-radius: 4px; }
            .feature h3 { margin: 0 0 5px 0; color: #d4641f; }
            .feature p { margin: 0; color: #666; font-size: 14px; }
            .cta { text-align: center; margin: 30px 0; }
            .cta-button { background: linear-gradient(135deg, #d4641f 0%, #dc851f 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }
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
              
              <p>Thank you for subscribing to Matasree Super! We're thrilled to have you join our community of spice enthusiasts.</p>
              
              <div class="discount-code">
                Your exclusive discount: WELCOME10
              </div>
              
              <p style="color: #d4641f; font-weight: bold;">Use code <strong>WELCOME10</strong> to get <strong>10% OFF</strong> your first order!</p>
              
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
                <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/products" class="cta-button">Shop Now</a>
              </div>
              
              <p>We'll keep you updated with:</p>
              <ul>
                <li>Exclusive recipes and cooking tips</li>
                <li>Limited-time offers and discounts</li>
                <li>New product launches</li>
                <li>Heritage stories and traditions</li>
              </ul>
              
              <p>Questions? Reply to this email or visit our <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/contact" style="color: #d4641f;">contact page</a>.</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Matasree Super. All rights reserved.</p>
              <p>Old Delhi, India | Serving 10L+ customers across 500+ cities</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Send notification email to admin
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: '📧 New Newsletter Subscriber',
      html: `
        <h2>New Newsletter Subscriber</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Subscribed at:</strong> ${new Date().toLocaleString()}</p>
      `,
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(welcomeMailOptions),
      transporter.sendMail(adminMailOptions),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed! Check your email for your 10% discount code.',
      email: email,
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
router.post('/contact', validateContact, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { name, email, subject, message, phone } = req.body;

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
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/contact" class="button">Visit Our Website</a>
              
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

    await Promise.all([
      transporter.sendMail(contactMailOptions),
      transporter.sendMail(replyMailOptions),
    ]);

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
