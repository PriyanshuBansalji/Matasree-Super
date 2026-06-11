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
export declare const sendOTPSMS: (mobile: string, otp: string) => Promise<boolean>;
/**
 * Verify transporter connection
 */
export declare const verifyEmailConnection: () => Promise<boolean>;
/**
 * Order confirmation email data
 */
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
    paymentMethod: 'cod' | 'razorpay';
}
/**
 * Send order confirmation email
 */
export declare const sendOrderConfirmationEmail: (order: OrderConfirmationData, recipientEmail: string) => Promise<boolean>;
//# sourceMappingURL=email.d.ts.map