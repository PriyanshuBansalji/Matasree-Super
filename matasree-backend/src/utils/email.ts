import nodemailer from 'nodemailer';
import twilio from 'twilio';

// ============================================================================
// Professional Sender Configuration & Environment Helpers
// Official Sender: Matasree Super <admin@matasreesuper.com>
// ============================================================================

export const getSenderString = (): string => {
  const name = process.env.MAIL_FROM_NAME || 'Matasree Super';
  const address = process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'admin@matasreesuper.com';
  return `"${name}" <${address}>`;
};

export const getReplyToAddress = (): string => {
  return process.env.REPLY_TO_ADDRESS || process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'admin@matasreesuper.com';
};

export const getAdminEmail = (): string => {
  return process.env.ADMIN_EMAIL || 'admin@matasreesuper.com';
};

// ============================================================================
// Security & Sanitization Helpers
// ============================================================================

/**
 * Escape HTML special characters to prevent HTML Injection / XSS in emails
 */
export const escapeHtml = (str: string | undefined | null): string => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Sanitize email header fields to prevent Header Injection attacks (CRLF stripping)
 */
export const sanitizeHeader = (value: string | undefined | null): string => {
  if (!value) return '';
  return String(value).replace(/[\r\n]/g, '').trim();
};

/**
 * Strip HTML tags to create plain text version of email
 */
export const stripHtml = (html: string): string => {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// ============================================================================
// Production Resilient Transporter Setup
// ============================================================================

const createProductionTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || 'admin@matasreesuper.com';
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || '';
  const service = process.env.EMAIL_SERVICE;

  let transportConfig: any;

  if (host && host.trim() !== '') {
    transportConfig = {
      host: host.trim(),
      port,
      secure,
      auth: { user: user.trim(), pass },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false, // Compatibility for custom SMTP servers
      },
    };
  } else if (service && service !== 'smtp') {
    transportConfig = {
      service,
      auth: { user: user.trim(), pass },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    };
  } else {
    // Default fallback
    transportConfig = {
      host: 'smtp.matasree.com',
      port: 587,
      secure: false,
      auth: { user: user.trim(), pass },
      connectionTimeout: 10000,
      socketTimeout: 10000,
      tls: { rejectUnauthorized: false },
    };
  }

  return nodemailer.createTransport(transportConfig);
};

export let transporter: any = createProductionTransporter();

// Verify SMTP connection on startup & fallback gracefully to mock console transport if SMTP fails
transporter.verify((error: any) => {
  if (error) {
    console.warn('⚠️  SMTP Transporter connection failed. Falling back to Mock Console Transporter.');
    console.warn(`   Error detail: ${error.message}`);
    transporter = {
      sendMail: async (mailOptions: any) => {
        console.log('\n=================== MOCK EMAIL SENT (utils/email) ===================');
        console.log('FROM:', mailOptions.from);
        console.log('TO:', mailOptions.to);
        console.log('REPLY-TO:', mailOptions.replyTo);
        console.log('SUBJECT:', mailOptions.subject);
        console.log('HTML (preview):', mailOptions.html ? stripHtml(mailOptions.html).substring(0, 250) + '...' : '(text only)');
        console.log('====================================================================\n');
        return { messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, response: '250 Mock OK' };
      },
      verify: async () => true,
    };
  } else {
    console.log(`✅ SMTP Transporter initialized successfully for ${getSenderString()}`);
  }
});

/**
 * Resilient sendMail helper with retry logic for transient SMTP errors
 */
const sendMailWithRetry = async (mailOptions: any, retries = 2): Promise<any> => {
  mailOptions.from = mailOptions.from || getSenderString();
  mailOptions.replyTo = mailOptions.replyTo || getReplyToAddress();
  mailOptions.subject = sanitizeHeader(mailOptions.subject);
  if (!mailOptions.text && mailOptions.html) {
    mailOptions.text = stripHtml(mailOptions.html);
  }

  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (err: any) {
      attempt++;
      console.warn(`⚠️  Email send attempt ${attempt}/${retries + 1} failed for ${mailOptions.to}: ${err.message}`);
      if (attempt > retries) {
        console.error(`❌ Permanent failure sending email to ${mailOptions.to}:`, err.message);
        throw err;
      }
      // Wait before retrying (exponential backoff 500ms, 1000ms)
      await new Promise((res) => setTimeout(res, attempt * 500));
    }
  }
};

// ============================================================================
// Twilio SMS Integration (Resilient Stub / Live Client)
// ============================================================================

let twilioClient: any = null;

if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC') &&
  process.env.TWILIO_ACCOUNT_SID !== 'your_account_sid_here'
) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio SMS service initialized');
  } catch (error: any) {
    console.warn('⚠️  Failed to initialize Twilio:', error.message);
  }
} else {
  console.warn('⚠️  SMS (Twilio) is not configured. Mobile OTP will log to console in dev.');
}

// ============================================================================
// Branded Responsive HTML Template Wrapper
// ============================================================================

export const wrapInTemplate = (title: string, contentHtml: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Matasree Super</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333333; -webkit-font-smoothing: antialiased; }
    .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #ff8c00 0%, #e65c00 100%); padding: 30px 40px; text-align: center; color: #ffffff; }
    .logo { font-size: 28px; font-weight: 800; letter-spacing: 1px; color: #ffffff; text-decoration: none; display: inline-block; }
    .tagline { color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px; font-weight: 500; }
    .body { padding: 35px 40px; line-height: 1.6; }
    .h1 { font-size: 22px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px; }
    .p { margin-top: 0; margin-bottom: 16px; font-size: 15px; color: #4b5563; }
    .btn { display: inline-block; background: linear-gradient(135deg, #ff8c00 0%, #e65c00 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 700; text-align: center; margin: 20px 0; box-shadow: 0 2px 8px rgba(255,140,0,0.3); }
    .card { background-color: #fff8f0; border: 1px solid #ffe6cc; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .footer { background-color: #f9fafb; padding: 25px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
    .footer a { color: #ff8c00; text-decoration: none; font-weight: 600; }
    @media only screen and (max-width: 600px) {
      .email-container { margin: 0; width: 100% !important; border-radius: 0; }
      .header, .body, .footer { padding: 25px 20px !important; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">🌶️ Matasree Super</div>
      <div class="tagline">Premium Spices &amp; Authentic Masalas</div>
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin:0 0 8px 0;">© 2026 Matasree Super. All rights reserved.</p>
      <p style="margin:0 0 8px 0;">Clement Town, Dehradun, Uttarakhand, India</p>
      <p style="margin:0;">Official Support: <a href="mailto:admin@matasreesuper.com">admin@matasreesuper.com</a> | <a href="${process.env.FRONTEND_URL || 'http://localhost:8000'}">Visit Store</a></p>
    </div>
  </div>
</body>
</html>`;
};

// ============================================================================
// Core Email Helper Functions
// ============================================================================

/**
 * Generic email sender helper
 */
export const sendEmail = async (options: {
  email: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> => {
  try {
    const mailOptions = {
      from: getSenderString(),
      to: sanitizeHeader(options.email),
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    };

    const info = await sendMailWithRetry(mailOptions);
    console.log(`✅ Email sent to ${options.email}: ${info.response || info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${options.email}:`, error.message);
    return false;
  }
};

/**
 * Verify Email Connection
 */
export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ Email transporter connection verified successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Email transporter connection verification failed:', error.message);
    return false;
  }
};

// ============================================================================
// 1. User Authentication Emails
// ============================================================================

/**
 * User Registration Welcome Email
 */
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  const safeName = escapeHtml(name || 'Valued Customer');
  const html = wrapInTemplate(
    'Welcome to Matasree Super',
    `<h1 class="h1">Welcome to Matasree Super, ${safeName}! 🎉</h1>
     <p class="p">We are thrilled to welcome you to the Matasree family! For over 40 years, we have been crafting 100% pure, stone-ground traditional spices and masalas.</p>
     <div class="card">
       <h3 style="margin:0 0 10px 0;color:#ff8c00;">What you can explore:</h3>
       <ul style="margin:0;padding-left:20px;color:#4b5563;font-size:14px;">
         <li>Pure single spices & handcrafted spice blends</li>
         <li>Fast & secure delivery across India</li>
         <li>Exclusive member-only discounts & loyalty rewards</li>
       </ul>
     </div>
     <div style="text-align:center;">
       <a href="${process.env.FRONTEND_URL || 'http://localhost:8000'}/products" class="btn">Explore Our Spices →</a>
     </div>`
  );

  return sendEmail({
    email,
    subject: 'Welcome to Matasree Super - Pure & Authentic Spices!',
    html,
  });
};

/**
 * Email Verification OTP Email
 */
export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  const safeOtp = escapeHtml(otp);
  const html = wrapInTemplate(
    'Verify Your Email',
    `<h1 class="h1">Email Verification</h1>
     <p class="p">Please use the verification code below to verify your email address and activate your account.</p>
     <div class="card" style="text-align:center;padding:25px;">
       <p style="margin:0 0 8px 0;color:#6b7280;font-size:12px;font-weight:700;letter-spacing:1px;">YOUR VERIFICATION CODE</p>
       <div style="font-size:36px;font-weight:800;color:#ff8c00;letter-spacing:6px;font-family:monospace;">${safeOtp}</div>
       <p style="margin:12px 0 0 0;color:#e65c00;font-size:12px;font-weight:600;">Valid for 5 minutes • Single-use only</p>
     </div>
     <p class="p" style="font-size:13px;color:#9ca3af;">If you did not request this verification code, please ignore this email.</p>`
  );

  return sendEmail({
    email,
    subject: 'Your Email Verification OTP - Matasree Super',
    html,
  });
};

/**
 * Login OTP Email
 */
export const sendLoginOTPEmail = async (email: string, otp: string, name?: string): Promise<boolean> => {
  const safeName = escapeHtml(name || 'User');
  const safeOtp = escapeHtml(otp);
  const html = wrapInTemplate(
    'Login Verification Code',
    `<h1 class="h1">Hello ${safeName},</h1>
     <p class="p">We received a request to log in to your Matasree Super account.</p>
     <div class="card" style="text-align:center;padding:25px;">
       <p style="margin:0 0 8px 0;color:#6b7280;font-size:12px;font-weight:700;letter-spacing:1px;">YOUR LOGIN OTP</p>
       <div style="font-size:36px;font-weight:800;color:#ff8c00;letter-spacing:6px;font-family:monospace;">${safeOtp}</div>
       <p style="margin:12px 0 0 0;color:#e65c00;font-size:12px;font-weight:600;">Valid for 5 minutes • Do not share this code</p>
     </div>
     <p class="p" style="font-size:13px;color:#9ca3af;">For security reasons, never share your OTP with anyone. Our support team will never ask for your OTP.</p>`
  );

  return sendEmail({
    email,
    subject: 'Your Login Verification Code - Matasree Super',
    html,
  });
};

/**
 * Password Reset Email
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetTokenOrOtp: string,
  name?: string
): Promise<boolean> => {
  const safeName = escapeHtml(name || 'Customer');
  const safeToken = escapeHtml(resetTokenOrOtp);
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8000'}/reset-password?token=${safeToken}&email=${encodeURIComponent(email)}`;

  const html = wrapInTemplate(
    'Reset Your Password',
    `<h1 class="h1">Password Reset Request</h1>
     <p class="p">Hello ${safeName}, we received a request to reset the password for your Matasree Super account.</p>
     <div class="card" style="text-align:center;">
       <p style="margin:0 0 10px 0;color:#374151;font-weight:600;">Click the button below to set a new password:</p>
       <a href="${resetUrl}" class="btn">Reset Password Now</a>
       <p style="margin:12px 0 0 0;font-size:12px;color:#6b7280;">Or use reset code: <strong style="color:#ff8c00;font-family:monospace;font-size:16px;">${safeToken}</strong></p>
     </div>
     <p class="p" style="font-size:13px;color:#9ca3af;">This password reset request expires in 15 minutes. If you did not request a password reset, your account is safe and no action is required.</p>`
  );

  return sendEmail({
    email,
    subject: 'Password Reset Request - Matasree Super',
    html,
  });
};

/**
 * Password Changed Notification
 */
export const sendPasswordChangedNotification = async (email: string, name?: string): Promise<boolean> => {
  const safeName = escapeHtml(name || 'Customer');
  const html = wrapInTemplate(
    'Password Changed Confirmation',
    `<h1 class="h1">Password Changed Successfully</h1>
     <p class="p">Hello ${safeName}, this is confirmation that the password for your Matasree Super account was successfully updated.</p>
     <div class="card">
       <p style="margin:0;color:#b91c1c;font-size:14px;font-weight:600;">⚠️ Didn't make this change?</p>
       <p style="margin:5px 0 0 0;color:#4b5563;font-size:13px;">If you did not perform this change, please immediately contact our support team at <a href="mailto:admin@matasreesuper.com" style="color:#ff8c00;font-weight:700;">admin@matasreesuper.com</a> to secure your account.</p>
     </div>`
  );

  return sendEmail({
    email,
    subject: 'Security Alert: Your Password Was Changed - Matasree Super',
    html,
  });
};

/**
 * Email Change Verification
 */
export const sendEmailChangeVerification = async (
  email: string,
  newEmail: string,
  otp: string
): Promise<boolean> => {
  const safeOtp = escapeHtml(otp);
  const safeNewEmail = escapeHtml(newEmail);
  const html = wrapInTemplate(
    'Verify New Email Address',
    `<h1 class="h1">Verify Email Address Change</h1>
     <p class="p">We received a request to change your Matasree Super account email to <strong>${safeNewEmail}</strong>.</p>
     <div class="card" style="text-align:center;padding:25px;">
       <p style="margin:0 0 8px 0;color:#6b7280;font-size:12px;font-weight:700;">CONFIRMATION CODE</p>
       <div style="font-size:36px;font-weight:800;color:#ff8c00;letter-spacing:6px;font-family:monospace;">${safeOtp}</div>
       <p style="margin:12px 0 0 0;color:#e65c00;font-size:12px;">Valid for 10 minutes</p>
     </div>`
  );

  return sendEmail({
    email: newEmail,
    subject: 'Verify Your New Email Address - Matasree Super',
    html,
  });
};

/**
 * Account Deletion Confirmation
 */
export const sendAccountDeletionEmail = async (email: string, name?: string): Promise<boolean> => {
  const safeName = escapeHtml(name || 'Valued Customer');
  const html = wrapInTemplate(
    'Account Deleted',
    `<h1 class="h1">Account Deletion Confirmed</h1>
     <p class="p">Hello ${safeName}, as requested, your Matasree Super account and associated personal profile details have been permanently removed from our active database.</p>
     <p class="p">We are sorry to see you go! If you ever decide to return, you are welcome to register a new account anytime.</p>`
  );

  return sendEmail({
    email,
    subject: 'Account Deletion Confirmed - Matasree Super',
    html,
  });
};

/**
 * SMS OTP via Twilio with fallback logger
 */
export const sendOTPSMS = async (mobile: string, otp: string): Promise<boolean> => {
  if (!twilioClient) {
    console.warn('⚠️ SMS (Twilio) is not configured. Mobile OTP logged for development:');
    console.log(`📱 [DEV SMS] Mobile: ${mobile} | OTP: ${otp}`);
    return false;
  }

  try {
    let formattedMobile = mobile.trim().replace(/[\s\-\(\)]/g, '');
    if (!formattedMobile.startsWith('+')) {
      if (formattedMobile.startsWith('91')) {
        formattedMobile = '+' + formattedMobile;
      } else if (formattedMobile.length === 10) {
        formattedMobile = '+91' + formattedMobile;
      } else {
        formattedMobile = '+91' + formattedMobile.replace(/^0+/, '');
      }
    }

    const message = await twilioClient.messages.create({
      body: `Your Matasree verification code is: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedMobile,
    });

    console.log(`✅ SMS sent to ${formattedMobile}. Message SID: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send SMS to ${mobile}:`, error.message);
    return false;
  }
};

// ============================================================================
// 2. Customer Order Emails
// ============================================================================

export interface OrderConfirmationData {
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentMethod: 'cod' | 'cashfree' | string;
}

/**
 * Order Confirmation Email
 */
export const sendOrderConfirmationEmail = async (
  order: OrderConfirmationData,
  recipientEmail: string
): Promise<boolean> => {
  const safeOrderNum = escapeHtml(order.orderNumber);
  const paymentBadge =
    order.paymentMethod === 'cod'
      ? `<span style="background-color:#f59e0b;color:#fff;padding:6px 14px;border-radius:12px;font-size:13px;font-weight:700;">💵 Cash on Delivery</span>`
      : `<span style="background-color:#22c55e;color:#fff;padding:6px 14px;border-radius:12px;font-size:13px;font-weight:700;">✅ Online Payment Confirmed</span>`;

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #f3f4f6;font-weight:600;">${escapeHtml(item.name)}</td>
        <td style="padding:12px;border-bottom:1px solid #f3f4f6;text-align:center;">${item.quantity}</td>
        <td style="padding:12px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const addr = order.shippingAddress;
  const addressBlock = [
    escapeHtml(addr.fullName),
    escapeHtml(addr.addressLine1),
    escapeHtml(addr.addressLine2),
    `${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} - ${escapeHtml(addr.pincode)}`,
    `📞 ${escapeHtml(addr.phone)}`,
  ]
    .filter(Boolean)
    .join('<br>');

  const html = wrapInTemplate(
    `Order Confirmed #${safeOrderNum}`,
    `<h1 class="h1">Order Confirmed! 🎉</h1>
     <p class="p">Thank you for your order. We are carefully packing your premium spices and will notify you when it ships.</p>
     <p class="p">Order Number: <strong style="color:#ff8c00;font-size:17px;">${safeOrderNum}</strong></p>

     <h3 style="font-size:16px;color:#111827;margin-top:24px;margin-bottom:12px;">Order Items</h3>
     <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
       <thead>
         <tr style="background-color:#fff8f0;color:#ff8c00;border-bottom:2px solid #ff8c00;">
           <th style="padding:10px 12px;text-align:left;">Item</th>
           <th style="padding:10px 12px;text-align:center;">Qty</th>
           <th style="padding:10px 12px;text-align:right;">Amount</th>
         </tr>
       </thead>
       <tbody>
         ${itemRows}
         <tr style="font-size:16px;font-weight:800;color:#111827;">
           <td colspan="2" style="padding:14px 12px;border-top:2px solid #ff8c00;">Total Amount Paid</td>
           <td style="padding:14px 12px;text-align:right;border-top:2px solid #ff8c00;color:#ff8c00;">₹${order.totalAmount.toFixed(2)}</td>
         </tr>
       </tbody>
     </table>

     <h3 style="font-size:16px;color:#111827;margin-top:20px;margin-bottom:8px;">Delivery Address</h3>
     <div class="card" style="line-height:1.7;">${addressBlock}</div>

     <h3 style="font-size:16px;color:#111827;margin-top:20px;margin-bottom:8px;">Payment Details</h3>
     <div style="margin-top:8px;">${paymentBadge}</div>`
  );

  return sendEmail({
    email: recipientEmail,
    subject: `Order Confirmed – #${safeOrderNum} | Matasree Super`,
    html,
  });
};

/**
 * Payment Success Email
 */
export const sendPaymentSuccessEmail = async (
  orderNumber: string,
  recipientEmail: string,
  amount: number,
  paymentId?: string
): Promise<boolean> => {
  const safeOrderNum = escapeHtml(orderNumber);
  const safePayId = escapeHtml(paymentId || 'N/A');
  const html = wrapInTemplate(
    'Payment Receipt',
    `<h1 class="h1">Payment Received Successfully! 💳</h1>
     <p class="p">Your payment of <strong>₹${amount.toFixed(2)}</strong> for order <strong>#${safeOrderNum}</strong> was successfully processed.</p>
     <div class="card">
       <p style="margin:0 0 6px 0;font-size:14px;"><strong>Order Number:</strong> ${safeOrderNum}</p>
       <p style="margin:0 0 6px 0;font-size:14px;"><strong>Payment Reference ID:</strong> <code style="font-family:monospace;color:#ff8c00;">${safePayId}</code></p>
       <p style="margin:0;font-size:14px;"><strong>Amount Paid:</strong> ₹${amount.toFixed(2)}</p>
     </div>
     <p class="p">Your order is now being processed for dispatch.</p>`
  );

  return sendEmail({
    email: recipientEmail,
    subject: `Payment Successful – #${safeOrderNum} | Matasree Super`,
    html,
  });
};

/**
 * Payment Failure Email
 */
export const sendPaymentFailureEmail = async (
  orderNumber: string,
  recipientEmail: string,
  amount: number,
  reason?: string
): Promise<boolean> => {
  const safeOrderNum = escapeHtml(orderNumber);
  const safeReason = escapeHtml(reason || 'Transaction could not be completed by your bank.');
  const html = wrapInTemplate(
    'Payment Failed',
    `<h1 class="h1" style="color:#b91c1c;">Payment Attempt Failed ❌</h1>
     <p class="p">We were unable to process your payment of <strong>₹${amount.toFixed(2)}</strong> for order <strong>#${safeOrderNum}</strong>.</p>
     <div class="card" style="background-color:#fef2f2;border-color:#fca5a5;">
       <p style="margin:0 0 6px 0;color:#991b1b;font-weight:700;">Reason:</p>
       <p style="margin:0;color:#7f1d1d;font-size:14px;">${safeReason}</p>
     </div>
     <p class="p">Don't worry! No funds were deducted from your account. You can retry paying for your order in your account portal.</p>
     <div style="text-align:center;">
       <a href="${process.env.FRONTEND_URL || 'http://localhost:8000'}/orders" class="btn">Retry Payment →</a>
     </div>`
  );

  return sendEmail({
    email: recipientEmail,
    subject: `Action Required: Payment Failed – #${safeOrderNum} | Matasree Super`,
    html,
  });
};

/**
 * Order Shipped Email
 */
export const sendShippedEmail = async (
  orderNumber: string,
  recipientEmail: string,
  estimatedDelivery: string,
  shippingAddress: any
): Promise<boolean> => {
  const safeOrderNum = escapeHtml(orderNumber);
  const safeEst = escapeHtml(estimatedDelivery);

  const addressBlock = shippingAddress
    ? [
        escapeHtml(shippingAddress.name || shippingAddress.fullName),
        escapeHtml(shippingAddress.addressLine1),
        escapeHtml(shippingAddress.addressLine2),
        `${escapeHtml(shippingAddress.city)}, ${escapeHtml(shippingAddress.state)} - ${escapeHtml(shippingAddress.pincode)}`,
        shippingAddress.phone ? `📞 ${escapeHtml(shippingAddress.phone)}` : '',
      ]
        .filter(Boolean)
        .join('<br>')
    : '';

  const html = wrapInTemplate(
    `Order Shipped #${safeOrderNum}`,
    `<h1 class="h1">Your Order has Shipped! 🚚</h1>
     <p class="p">Great news! Your package is on its way to you.</p>
     <p class="p">Order Number: <strong style="color:#ff8c00;">${safeOrderNum}</strong></p>
     
     <div class="card">
       <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">📅 Estimated Delivery Date:</p>
       <p style="margin:6px 0 0 0;font-size:18px;font-weight:800;color:#ff8c00;">${safeEst}</p>
     </div>

     ${addressBlock ? `<h3 style="font-size:15px;color:#111827;">Shipping Address</h3><div class="card">${addressBlock}</div>` : ''}`
  );

  return sendEmail({
    email: recipientEmail,
    subject: `Order Shipped – #${safeOrderNum} | Matasree Super`,
    html,
  });
};

/**
 * Out For Delivery Email
 */
export const sendOutForDeliveryEmail = async (
  orderNumber: string,
  recipientEmail: string,
  shippingAddress?: any
): Promise<boolean> => {
  const safeOrderNum = escapeHtml(orderNumber);
  const html = wrapInTemplate(
    `Out For Delivery #${safeOrderNum}`,
    `<h1 class="h1">Your Package is Out for Delivery! 📦</h1>
     <p class="p">Exciting news! Your Matasree Super order <strong>#${safeOrderNum}</strong> is out for delivery with our delivery partner today.</p>
     <div class="card">
       <p style="margin:0;font-size:14px;color:#374151;">Please ensure someone is available at your delivery address to receive the package.</p>
     </div>`
  );

  return sendEmail({
    email: recipientEmail,
    subject: `Out For Delivery Today – #${safeOrderNum} | Matasree Super`,
    html,
  });
};

/**
 * Order Delivered Email
 */
export const sendDeliveredEmail = async (
  orderNumber: string,
  recipientEmail: string
): Promise<boolean> => {
  const safeOrderNum = escapeHtml(orderNumber);
  const html = wrapInTemplate(
    `Order Delivered #${safeOrderNum}`,
    `<h1 class="h1">Order Delivered! 🎉</h1>
     <p class="p">Your order <strong>#${safeOrderNum}</strong> has been successfully delivered.</p>
     <p class="p">We hope you enjoy your premium spices! If you loved your purchase, please take a moment to leave a review on our website.</p>
     <div style="text-align:center;">
       <a href="${process.env.FRONTEND_URL || 'http://localhost:8000'}/products" class="btn">Leave a Product Review →</a>
     </div>`
  );

  return sendEmail({
    email: recipientEmail,
    subject: `Order Delivered – #${safeOrderNum} | Matasree Super`,
    html,
  });
};

/**
 * Order Cancelled Email
 */
export const sendCancelledEmail = async (
  orderNumber: string,
  recipientEmail: string,
  refundAmount?: number
): Promise<boolean> => {
  const safeOrderNum = escapeHtml(orderNumber);
  const refundInfo =
    refundAmount && refundAmount > 0
      ? `<div class="card" style="background-color:#fef2f2;border-color:#fca5a5;">
           <p style="margin:0;color:#991b1b;font-weight:700;">💰 Refund Information:</p>
           <p style="margin:4px 0 0 0;color:#7f1d1d;font-size:14px;">A refund of <strong>₹${refundAmount.toFixed(2)}</strong> has been initiated and will reflect in your account within 5-7 business days.</p>
         </div>`
      : '';

  const html = wrapInTemplate(
    `Order Cancelled #${safeOrderNum}`,
    `<h1 class="h1" style="color:#b91c1c;">Order Cancelled 🚫</h1>
     <p class="p">Your order <strong>#${safeOrderNum}</strong> has been cancelled.</p>
     ${refundInfo}
     <p class="p">If you have any questions or feel this was a mistake, please contact our support team at <a href="mailto:admin@matasreesuper.com" style="color:#ff8c00;">admin@matasreesuper.com</a>.</p>`
  );

  return sendEmail({
    email: recipientEmail,
    subject: `Order Cancelled – #${safeOrderNum} | Matasree Super`,
    html,
  });
};

/**
 * Refund Initiated Email
 */
export const sendRefundInitiatedEmail = async (
  orderNumber: string,
  recipientEmail: string,
  refundAmount: number
): Promise<boolean> => {
  const safeOrderNum = escapeHtml(orderNumber);
  const html = wrapInTemplate(
    'Refund Initiated',
    `<h1 class="h1">Refund Initiated 💸</h1>
     <p class="p">A refund of <strong>₹${refundAmount.toFixed(2)}</strong> for order <strong>#${safeOrderNum}</strong> has been successfully initiated.</p>
     <div class="card">
       <p style="margin:0;font-size:14px;color:#374151;">The refund amount will be credited back to your original payment method within 5 to 7 business days depending on your bank.</p>
     </div>`
  );

  return sendEmail({
    email: recipientEmail,
    subject: `Refund Initiated – #${safeOrderNum} | Matasree Super`,
    html,
  });
};

/**
 * Refund Completed Email
 */
export const sendRefundCompletedEmail = async (
  orderNumber: string,
  recipientEmail: string,
  refundAmount: number,
  refundId?: string
): Promise<boolean> => {
  const safeOrderNum = escapeHtml(orderNumber);
  const safeRefundId = escapeHtml(refundId || 'N/A');
  const html = wrapInTemplate(
    'Refund Completed',
    `<h1 class="h1">Refund Processed &amp; Completed ✅</h1>
     <p class="p">Your refund of <strong>₹${refundAmount.toFixed(2)}</strong> for order <strong>#${safeOrderNum}</strong> has been completed.</p>
     <div class="card">
       <p style="margin:0 0 6px 0;font-size:14px;"><strong>Order Number:</strong> ${safeOrderNum}</p>
       <p style="margin:0 0 6px 0;font-size:14px;"><strong>Refund Reference ID:</strong> <code style="font-family:monospace;color:#ff8c00;">${safeRefundId}</code></p>
       <p style="margin:0;font-size:14px;"><strong>Refund Amount:</strong> ₹${refundAmount.toFixed(2)}</p>
     </div>`
  );

  return sendEmail({
    email: recipientEmail,
    subject: `Refund Completed – #${safeOrderNum} | Matasree Super`,
    html,
  });
};

// ============================================================================
// 3. Contact & Support System Emails
// ============================================================================

/**
 * Contact Form Receipt (Customer Auto-Reply)
 */
export const sendContactReceiptEmail = async (
  email: string,
  name: string,
  subject: string
): Promise<boolean> => {
  const safeName = escapeHtml(name);
  const safeSub = escapeHtml(subject);

  const html = wrapInTemplate(
    'We Received Your Message',
    `<h1 class="h1">Thank You for Contacting Us, ${safeName}!</h1>
     <p class="p">We have received your message regarding <strong>"${safeSub}"</strong>. Our customer care team is reviewing it and will get back to you within 24 hours.</p>
     <div class="card">
       <p style="margin:0;font-size:14px;color:#4b5563;">Need urgent assistance? You can reach us directly at <a href="mailto:admin@matasreesuper.com" style="color:#ff8c00;font-weight:700;">admin@matasreesuper.com</a>.</p>
     </div>`
  );

  return sendEmail({
    email,
    subject: 'We Received Your Message - Matasree Super Support',
    html,
  });
};

/**
 * Customer Support Reply (Admin to Customer)
 */
export const sendCustomerSupportReplyEmail = async (
  email: string,
  name: string,
  originalSubject: string,
  replyMessage: string
): Promise<boolean> => {
  const safeName = escapeHtml(name);
  const safeSub = escapeHtml(originalSubject);
  const safeReply = escapeHtml(replyMessage).replace(/\n/g, '<br>');

  const html = wrapInTemplate(
    `Re: ${safeSub}`,
    `<h1 class="h1">Response from Matasree Super Support</h1>
     <p class="p">Dear ${safeName},</p>
     <div class="card" style="background-color:#ffffff;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
       <p style="margin:0 0 10px 0;font-size:12px;color:#9ca3af;font-weight:700;">OUR RESPONSE:</p>
       <div style="font-size:15px;color:#1f2937;line-height:1.7;">${safeReply}</div>
     </div>
     <p class="p" style="font-size:13px;color:#6b7280;">Regarding your query: <em>"${safeSub}"</em></p>`
  );

  return sendEmail({
    email,
    subject: `Re: ${safeSub} - Matasree Super Support`,
    html,
  });
};

/**
 * Admin Contact Notification
 */
export const sendAdminContactAlertEmail = async (contactData: {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
}): Promise<boolean> => {
  const adminEmail = getAdminEmail();
  const safeName = escapeHtml(contactData.name);
  const safeUserEmail = escapeHtml(contactData.email);
  const safeSub = escapeHtml(contactData.subject);
  const safePhone = escapeHtml(contactData.phone || 'Not provided');
  const safeMsg = escapeHtml(contactData.message).replace(/\n/g, '<br>');

  const html = wrapInTemplate(
    'New Contact Submission',
    `<h1 class="h1">📩 New Contact Form Submission</h1>
     <div class="card">
       <p style="margin:0 0 8px 0;font-size:14px;"><strong>From Name:</strong> ${safeName}</p>
       <p style="margin:0 0 8px 0;font-size:14px;"><strong>Email:</strong> ${safeUserEmail}</p>
       <p style="margin:0 0 8px 0;font-size:14px;"><strong>Phone:</strong> ${safePhone}</p>
       <p style="margin:0 0 8px 0;font-size:14px;"><strong>Subject:</strong> ${safeSub}</p>
       <hr style="border:0;border-top:1px solid #ffe6cc;margin:12px 0;">
       <p style="margin:0 0 4px 0;font-size:12px;color:#9ca3af;font-weight:700;">MESSAGE:</p>
       <div style="font-size:14px;color:#111827;">${safeMsg}</div>
     </div>`
  );

  return sendEmail({
    email: adminEmail,
    subject: `[Contact Form] ${safeSub} - From ${safeName}`,
    html,
  });
};

// ============================================================================
// 4. Marketing & Newsletter Emails
// ============================================================================

/**
 * Newsletter Welcome + Exclusive Coupon Email
 */
export const sendNewsletterWelcomeEmail = async (
  email: string,
  name: string,
  couponCode: string,
  discountValue = 10,
  maxDiscount = 200,
  minOrder = 199,
  expiresAt?: Date
): Promise<boolean> => {
  const safeName = escapeHtml(name || 'Valued Customer');
  const safeCode = escapeHtml(couponCode);
  const expiryString = expiresAt ? new Date(expiresAt).toLocaleDateString('en-IN') : '30 days';

  const html = wrapInTemplate(
    'Welcome to Newsletter',
    `<h1 class="h1">Welcome to Matasree Super! 🎉</h1>
     <p class="p">Hello ${safeName}, thank you for subscribing to our newsletter! Here is your exclusive welcome coupon code:</p>
     <div class="card" style="text-align:center;padding:25px;background:linear-gradient(135deg,#fff8f0 0%,#ffe6cc 100%);">
       <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;color:#6b7280;">EXCLUSIVELY FOR YOU</p>
       <div style="font-size:32px;font-weight:800;color:#ff8c00;letter-spacing:4px;font-family:monospace;">${safeCode}</div>
       <p style="margin:10px 0 0 0;font-size:16px;font-weight:700;color:#e65c00;">Get ${discountValue}% OFF Your First Order (Up to ₹${maxDiscount})</p>
     </div>
     <div style="font-size:13px;color:#6b7280;margin:15px 0;">
       <strong>Terms:</strong> Min Order ₹${minOrder} • Valid once per customer • Expires on ${expiryString}
     </div>
     <div style="text-align:center;">
       <a href="${process.env.FRONTEND_URL || 'http://localhost:8000'}/products" class="btn">Shop Now &amp; Use Code →</a>
     </div>`
  );

  return sendEmail({
    email,
    subject: '🎉 Welcome to Matasree Super - Your Exclusive 10% Discount Code Inside!',
    html,
  });
};

/**
 * Promotional Broadcast Email
 */
export const sendPromotionalEmail = async (
  email: string,
  subject: string,
  promoTitle: string,
  promoBody: string,
  ctaUrl?: string,
  ctaText?: string
): Promise<boolean> => {
  const safeTitle = escapeHtml(promoTitle);
  const safeBody = escapeHtml(promoBody).replace(/\n/g, '<br>');
  const safeCtaText = escapeHtml(ctaText || 'Shop Offer Now →');

  const html = wrapInTemplate(
    safeTitle,
    `<h1 class="h1">${safeTitle}</h1>
     <div class="p">${safeBody}</div>
     ${ctaUrl ? `<div style="text-align:center;"><a href="${escapeHtml(ctaUrl)}" class="btn">${safeCtaText}</a></div>` : ''}`
  );

  return sendEmail({
    email,
    subject: sanitizeHeader(subject),
    html,
  });
};

// ============================================================================
// 5. Admin System Alerts
// ============================================================================

/**
 * Low Stock Admin Alert Email
 */
export const sendLowStockNotificationEmail = async (
  adminEmail: string,
  items: Array<{ name: string; sku?: string; stock: number; threshold: number }>
): Promise<boolean> => {
  const targetEmail = adminEmail || getAdminEmail();
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${escapeHtml(item.name)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${escapeHtml(item.sku || 'N/A')}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;color:#b91c1c;font-weight:700;">${item.stock}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.threshold}</td>
      </tr>`
    )
    .join('');

  const html = wrapInTemplate(
    'Low Stock Alert',
    `<h1 class="h1" style="color:#b91c1c;">⚠️ Low Stock Inventory Alert</h1>
     <p class="p">The following inventory items are below their minimum threshold stock level:</p>
     <table style="width:100%;border-collapse:collapse;font-size:14px;">
       <thead>
         <tr style="background:#fef2f2;color:#991b1b;">
           <th style="padding:10px;text-align:left;">Product</th>
           <th style="padding:10px;text-align:center;">SKU</th>
           <th style="padding:10px;text-align:center;">Current Stock</th>
           <th style="padding:10px;text-align:center;">Threshold</th>
         </tr>
       </thead>
       <tbody>${rows}</tbody>
     </table>`
  );

  return sendEmail({
    email: targetEmail,
    subject: '⚠️ Inventory Alert: Low Stock Detected - Matasree Super',
    html,
  });
};

/**
 * New Order Admin Alert Email
 */
export const sendNewOrderAdminNotificationEmail = async (
  adminEmail: string,
  order: { orderNumber: string; totalAmount: number; customerName?: string; customerEmail: string }
): Promise<boolean> => {
  const targetEmail = adminEmail || getAdminEmail();
  const safeNum = escapeHtml(order.orderNumber);
  const safeName = escapeHtml(order.customerName || 'Customer');

  const html = wrapInTemplate(
    'New Order Received',
    `<h1 class="h1">🛍️ New Order Received!</h1>
     <div class="card">
       <p style="margin:0 0 6px 0;font-size:14px;"><strong>Order Number:</strong> #${safeNum}</p>
       <p style="margin:0 0 6px 0;font-size:14px;"><strong>Customer:</strong> ${safeName} (${escapeHtml(order.customerEmail)})</p>
       <p style="margin:0;font-size:16px;font-weight:800;color:#ff8c00;"><strong>Total Value:</strong> ₹${order.totalAmount.toFixed(2)}</p>
     </div>`
  );

  return sendEmail({
    email: targetEmail,
    subject: `🛍️ New Order Alert: #${safeNum} (₹${order.totalAmount.toFixed(2)})`,
    html,
  });
};

/**
 * Failed Payment Admin Alert Email
 */
export const sendFailedPaymentAdminAlert = async (
  adminEmail: string,
  orderNumber: string,
  amount: number,
  reason?: string
): Promise<boolean> => {
  const targetEmail = adminEmail || getAdminEmail();
  const safeNum = escapeHtml(orderNumber);
  const safeReason = escapeHtml(reason || 'Gateway error');

  const html = wrapInTemplate(
    'Failed Payment Alert',
    `<h1 class="h1" style="color:#b91c1c;">🚨 Payment Failure Alert</h1>
     <div class="card" style="background:#fef2f2;border-color:#fca5a5;">
       <p style="margin:0 0 6px 0;font-size:14px;"><strong>Order Number:</strong> #${safeNum}</p>
       <p style="margin:0 0 6px 0;font-size:14px;"><strong>Attempted Amount:</strong> ₹${amount.toFixed(2)}</p>
       <p style="margin:0;font-size:14px;"><strong>Failure Reason:</strong> ${safeReason}</p>
     </div>`
  );

  return sendEmail({
    email: targetEmail,
    subject: `🚨 Payment Failure Alert: Order #${safeNum}`,
    html,
  });
};

/**
 * System Health Alert Email
 */
export const sendSystemAlertEmail = async (
  adminEmail: string,
  subject: string,
  alertDetails: string
): Promise<boolean> => {
  const targetEmail = adminEmail || getAdminEmail();
  const safeSub = escapeHtml(subject);
  const safeDetails = escapeHtml(alertDetails).replace(/\n/g, '<br>');

  const html = wrapInTemplate(
    'System Alert',
    `<h1 class="h1" style="color:#b91c1c;">🔔 System Notification</h1>
     <div class="card">
       <div style="font-family:monospace;font-size:13px;color:#111827;">${safeDetails}</div>
     </div>`
  );

  return sendEmail({
    email: targetEmail,
    subject: `[SYSTEM ALERT] ${safeSub}`,
    html,
  });
};
