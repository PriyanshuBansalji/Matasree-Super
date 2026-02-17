/**
 * Send generic email with custom HTML
 */
export declare const sendEmail: (options: {
    email: string;
    subject: string;
    html: string;
}) => Promise<boolean>;
/**
 * Send OTP email
 */
export declare const sendOTPEmail: (email: string, otp: string) => Promise<boolean>;
/**
 * Send SMS OTP via Twilio
 */
export declare const sendOTPSMS: (mobile: string, otp: string) => Promise<boolean>;
/**
 * Verify transporter connection
 */
export declare const verifyEmailConnection: () => Promise<boolean>;
//# sourceMappingURL=email.d.ts.map