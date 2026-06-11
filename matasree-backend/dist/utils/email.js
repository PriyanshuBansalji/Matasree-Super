"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderConfirmationEmail = exports.verifyEmailConnection = exports.sendOTPSMS = exports.sendOTPEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const twilio_1 = __importDefault(require("twilio"));
// Email transporter
const transporter = nodemailer_1.default.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});
// Twilio client for SMS
let twilioClient = null;
// Initialize Twilio if valid credentials are provided
if (process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC') &&
    process.env.TWILIO_ACCOUNT_SID !== 'your_account_sid_here') {
    try {
        twilioClient = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('✅ Twilio SMS service initialized');
    }
    catch (error) {
        console.warn('⚠️  Failed to initialize Twilio:', error.message);
    }
}
else {
    console.warn('⚠️  SMS (Twilio) is not configured. Mobile OTP will not be delivered.');
    console.warn('   To enable SMS, add valid TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env');
}
/**
 * Send generic email with custom HTML
 */
const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `Matasree <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.html,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${options.email}: ${info.response}`);
        return true;
    }
    catch (error) {
        console.error(`❌ Failed to send email to ${options.email}:`, error.message);
        return false;
    }
};
exports.sendEmail = sendEmail;
/**
 * Send OTP email
 */
const sendOTPEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: `Matasree <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Email Verification OTP - Matasree',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background-color: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #ff8c00; }
            .content { text-align: center; margin: 30px 0; }
            .otp-box { background-color: #fff8f0; border: 2px solid #ff8c00; border-radius: 8px; padding: 20px; margin: 30px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #ff8c00; letter-spacing: 4px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌶️ Matasree</div>
              <p style="color: #666; margin-top: 5px;">Premium Spices & Masalas</p>
            </div>
            
            <div class="content">
              <h2 style="color: #333;">Email Verification</h2>
              <p style="color: #666; font-size: 14px;">We received a request to verify your email address. Please use the code below to complete your registration.</p>
              
              <div class="otp-box">
                <p style="color: #666; margin: 0 0 10px 0; font-size: 12px;">YOUR VERIFICATION CODE</p>
                <div class="otp-code">${otp}</div>
                <p style="color: #ff8c00; margin: 10px 0 0 0; font-size: 12px; font-weight: bold;">Valid for 5 minutes</p>
              </div>
              
              <p style="color: #999; font-size: 13px;">If you did not request this code, please ignore this email or contact our support team.</p>
            </div>
            
            <div class="footer">
              <p>© 2026 Matasree. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${email}: ${info.response}`);
        return true;
    }
    catch (error) {
        console.error(`❌ Failed to send email to ${email}:`, error.message);
        return false;
    }
};
exports.sendOTPEmail = sendOTPEmail;
/**
 * Send SMS OTP via Twilio.
 *
 * @stub Twilio SMS integration is a stub. Configure TWILIO_ACCOUNT_SID,
 * TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env to enable live SMS delivery.
 *
 * When Twilio credentials are absent the function returns `false` and logs a
 * warning instead of throwing an unhandled exception.
 *
 * Required environment variables:
 *   - TWILIO_ACCOUNT_SID  — Twilio Account SID (must start with "AC")
 *   - TWILIO_AUTH_TOKEN   — Twilio Auth Token
 *   - TWILIO_PHONE_NUMBER — Twilio sender phone number (E.164 format, e.g. +1234567890)
 */
const sendOTPSMS = async (mobile, otp) => {
    // Guard: return false immediately when Twilio is not configured (no exception)
    if (!twilioClient) {
        console.warn('⚠️  SMS (Twilio) is not configured. Mobile OTP will not be delivered.');
        console.log(`   [DEV] SMS OTP for ${mobile}: ${otp}`);
        return false;
    }
    try {
        console.log(`📱 Sending SMS OTP to ${mobile}: ${otp}`);
        // Validate and format mobile number
        let formattedMobile = mobile.trim();
        // Remove any spaces, hyphens, or parentheses
        formattedMobile = formattedMobile.replace(/[\s\-\(\)]/g, '');
        // Add +91 prefix if not already present (for India)
        if (!formattedMobile.startsWith('+')) {
            if (formattedMobile.startsWith('91')) {
                formattedMobile = '+' + formattedMobile;
            }
            else if (formattedMobile.length === 10) {
                // Just the 10-digit number
                formattedMobile = '+91' + formattedMobile;
            }
            else {
                formattedMobile = '+91' + formattedMobile.replace(/^0+/, ''); // Remove leading 0
            }
        }
        console.log(`📱 Formatted mobile number: ${formattedMobile}`);
        // Send SMS via Twilio
        const message = await twilioClient.messages.create({
            body: `Your Matasree verification code is: ${otp}. Valid for 5 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedMobile,
        });
        console.log(`✅ SMS sent successfully to ${formattedMobile}. Message SID: ${message.sid}`);
        return true;
    }
    catch (error) {
        console.error(`❌ Failed to send SMS to ${mobile}:`, error.message);
        // Fallback: notify admin of the failure
        if (process.env.ADMIN_EMAIL) {
            try {
                const mailOptions = {
                    from: `Matasree <${process.env.EMAIL_USER}>`,
                    to: process.env.ADMIN_EMAIL,
                    subject: `[ALERT] SMS OTP Failed for ${mobile}`,
                    html: `
            <p style="color: #d32f2f;"><strong>⚠️ SMS Sending Failed</strong></p>
            <p><strong>Mobile:</strong> ${mobile}</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>OTP (for manual entry):</strong> <code style="font-size: 18px; font-weight: bold;">${otp}</code></p>
            <p style="font-size: 12px; color: #666;"><strong>Note:</strong> Twilio free trial can only send to verified numbers. Add the number in Twilio console.</p>
          `,
                };
                await transporter.sendMail(mailOptions);
            }
            catch (emailError) {
                console.warn('Could not notify admin of SMS failure');
            }
        }
        return false;
    }
};
exports.sendOTPSMS = sendOTPSMS;
/**
 * Verify transporter connection
 */
const verifyEmailConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email transporter verified successfully');
        return true;
    }
    catch (error) {
        console.error('❌ Email transporter verification failed:', error.message);
        return false;
    }
};
exports.verifyEmailConnection = verifyEmailConnection;
/**
 * Send order confirmation email
 */
const sendOrderConfirmationEmail = async (order, recipientEmail) => {
    try {
        const paymentBadge = order.paymentMethod === 'cod'
            ? `<span style="background-color:#f59e0b;color:#fff;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:bold;">💵 Cash on Delivery</span>
           <p style="color:#555;font-size:13px;margin:8px 0 0 0;">Pay when your order arrives</p>`
            : `<span style="background-color:#22c55e;color:#fff;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:bold;">✅ Online Payment</span>
           <p style="color:#555;font-size:13px;margin:8px 0 0 0;">Payment confirmed</p>`;
        const itemRows = order.items
            .map((item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">${item.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`)
            .join('');
        const addr = order.shippingAddress;
        const addressBlock = [
            addr.fullName,
            addr.addressLine1,
            addr.addressLine2,
            `${addr.city}, ${addr.state} - ${addr.pincode}`,
            `📞 ${addr.phone}`,
        ]
            .filter(Boolean)
            .join('<br>');
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #ff8c00, #e65c00); padding: 30px 40px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; color: #fff; }
          .tagline { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px; }
          .body { padding: 30px 40px; }
          .section-title { font-size: 15px; font-weight: bold; color: #333; margin: 24px 0 10px 0; border-left: 4px solid #ff8c00; padding-left: 10px; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          thead tr { background-color: #fff8f0; }
          thead th { padding: 10px 12px; text-align: left; color: #ff8c00; font-weight: bold; border-bottom: 2px solid #ff8c00; }
          thead th:nth-child(2) { text-align: center; }
          thead th:nth-child(3) { text-align: right; }
          .total-row td { padding: 12px; font-weight: bold; font-size: 15px; color: #333; border-top: 2px solid #ff8c00; }
          .address-box { background-color: #f9f9f9; border: 1px solid #eee; border-radius: 6px; padding: 14px 16px; font-size: 14px; color: #444; line-height: 1.7; }
          .payment-box { margin-top: 8px; }
          .footer { background-color: #f5f5f5; text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌶️ Matasree</div>
            <div class="tagline">Premium Spices &amp; Masalas</div>
          </div>

          <div class="body">
            <h2 style="color:#333;margin-top:0;">Order Confirmed! 🎉</h2>
            <p style="color:#555;font-size:14px;">Thank you for your order. We're preparing it with care and will keep you updated.</p>
            <p style="font-size:14px;color:#555;">Order Number: <strong style="color:#ff8c00;">${order.orderNumber}</strong></p>

            <div class="section-title">Order Items</div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
                <tr class="total-row">
                  <td colspan="2" style="padding:12px;border-top:2px solid #ff8c00;">Total</td>
                  <td style="padding:12px;text-align:right;border-top:2px solid #ff8c00;">₹${order.totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="section-title">Shipping Address</div>
            <div class="address-box">${addressBlock}</div>

            <div class="section-title">Payment</div>
            <div class="payment-box">${paymentBadge}</div>
          </div>

          <div class="footer">
            <p>© 2026 Matasree. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        const mailOptions = {
            from: `Matasree <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: `Order Confirmed – #${order.orderNumber} | Matasree`,
            html,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Order confirmation email sent to ${recipientEmail}: ${info.response}`);
        return true;
    }
    catch (error) {
        console.error(`❌ Failed to send order confirmation email to ${recipientEmail}:`, error.message);
        return false;
    }
};
exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
//# sourceMappingURL=email.js.map