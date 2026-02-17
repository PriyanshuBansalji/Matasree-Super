"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailConnection = exports.sendOTPSMS = exports.sendOTPEmail = exports.sendEmail = void 0;
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
    console.log('⚠️  Twilio SMS credentials not configured. SMS will not be sent.');
    console.log('   To enable SMS, add valid TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env');
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
 * Send SMS OTP via Twilio
 */
const sendOTPSMS = async (mobile, otp) => {
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
        // Check if Twilio is configured
        if (!twilioClient) {
            console.warn('⚠️  Twilio not configured. Cannot send real SMS.');
            console.log(`   [DEV] SMS would be sent to ${formattedMobile} with OTP: ${otp}`);
            console.log('   To enable real SMS, ensure valid Twilio credentials in .env file');
            // Fallback: log to admin email for visibility
            if (process.env.ADMIN_EMAIL) {
                try {
                    const mailOptions = {
                        from: `Matasree <${process.env.EMAIL_USER}>`,
                        to: process.env.ADMIN_EMAIL,
                        subject: `[DEV] SMS OTP for ${formattedMobile}`,
                        html: `
              <p><strong>Development Mode - SMS OTP</strong></p>
              <p><strong>Mobile:</strong> ${formattedMobile}</p>
              <p><strong>OTP:</strong> <code style="font-size: 20px; font-weight: bold; background: #f0f0f0; padding: 10px; display: inline-block;">${otp}</code></p>
              <p><strong>Expires in:</strong> 5 minutes</p>
              <p style="color: #999; font-size: 12px;">Configure valid Twilio credentials to send real SMS messages</p>
            `,
                    };
                    await transporter.sendMail(mailOptions);
                }
                catch (emailError) {
                    console.warn('Could not send SMS notification to admin email');
                }
            }
            return true;
        }
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
//# sourceMappingURL=email.js.map