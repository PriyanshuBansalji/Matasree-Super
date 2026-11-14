export declare const getSenderString: () => string;
export declare const getReplyToAddress: () => string;
export declare const getAdminEmail: () => string;
/**
 * Escape HTML special characters to prevent HTML Injection / XSS in emails
 */
export declare const escapeHtml: (str: string | undefined | null) => string;
/**
 * Sanitize email header fields to prevent Header Injection attacks (CRLF stripping)
 */
export declare const sanitizeHeader: (value: string | undefined | null) => string;
/**
 * Strip HTML tags to create plain text version of email
 */
export declare const stripHtml: (html: string) => string;
export declare let transporter: any;
export declare const wrapInTemplate: (title: string, contentHtml: string) => string;
/**
 * Generic email sender helper
 */
export declare const sendEmail: (options: {
    email: string;
    subject: string;
    html: string;
    text?: string;
}) => Promise<boolean>;
/**
 * Verify Email Connection
 */
export declare const verifyEmailConnection: () => Promise<boolean>;
/**
 * User Registration Welcome Email
 */
export declare const sendWelcomeEmail: (email: string, name: string) => Promise<boolean>;
/**
 * Email Verification OTP Email
 */
export declare const sendOTPEmail: (email: string, otp: string) => Promise<boolean>;
/**
 * Login OTP Email
 */
export declare const sendLoginOTPEmail: (email: string, otp: string, name?: string) => Promise<boolean>;
/**
 * Password Reset Email
 */
export declare const sendPasswordResetEmail: (email: string, resetTokenOrOtp: string, name?: string) => Promise<boolean>;
/**
 * Password Changed Notification
 */
export declare const sendPasswordChangedNotification: (email: string, name?: string) => Promise<boolean>;
/**
 * Email Change Verification
 */
export declare const sendEmailChangeVerification: (email: string, newEmail: string, otp: string) => Promise<boolean>;
/**
 * Account Deletion Confirmation
 */
export declare const sendAccountDeletionEmail: (email: string, name?: string) => Promise<boolean>;
/**
 * SMS OTP via Twilio with fallback logger
 */
export declare const sendOTPSMS: (mobile: string, otp: string) => Promise<boolean>;
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
    paymentMethod: 'cod' | 'razorpay' | string;
}
/**
 * Order Confirmation Email
 */
export declare const sendOrderConfirmationEmail: (order: OrderConfirmationData, recipientEmail: string) => Promise<boolean>;
/**
 * Payment Success Email
 */
export declare const sendPaymentSuccessEmail: (orderNumber: string, recipientEmail: string, amount: number, paymentId?: string) => Promise<boolean>;
/**
 * Payment Failure Email
 */
export declare const sendPaymentFailureEmail: (orderNumber: string, recipientEmail: string, amount: number, reason?: string) => Promise<boolean>;
/**
 * Order Shipped Email
 */
export declare const sendShippedEmail: (orderNumber: string, recipientEmail: string, estimatedDelivery: string, shippingAddress: any) => Promise<boolean>;
/**
 * Out For Delivery Email
 */
export declare const sendOutForDeliveryEmail: (orderNumber: string, recipientEmail: string, shippingAddress?: any) => Promise<boolean>;
/**
 * Order Delivered Email
 */
export declare const sendDeliveredEmail: (orderNumber: string, recipientEmail: string) => Promise<boolean>;
/**
 * Order Cancelled Email
 */
export declare const sendCancelledEmail: (orderNumber: string, recipientEmail: string, refundAmount?: number) => Promise<boolean>;
/**
 * Refund Initiated Email
 */
export declare const sendRefundInitiatedEmail: (orderNumber: string, recipientEmail: string, refundAmount: number) => Promise<boolean>;
/**
 * Refund Completed Email
 */
export declare const sendRefundCompletedEmail: (orderNumber: string, recipientEmail: string, refundAmount: number, refundId?: string) => Promise<boolean>;
/**
 * Contact Form Receipt (Customer Auto-Reply)
 */
export declare const sendContactReceiptEmail: (email: string, name: string, subject: string) => Promise<boolean>;
/**
 * Customer Support Reply (Admin to Customer)
 */
export declare const sendCustomerSupportReplyEmail: (email: string, name: string, originalSubject: string, replyMessage: string) => Promise<boolean>;
/**
 * Admin Contact Notification
 */
export declare const sendAdminContactAlertEmail: (contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
    phone?: string;
}) => Promise<boolean>;
/**
 * Newsletter Welcome + Exclusive Coupon Email
 */
export declare const sendNewsletterWelcomeEmail: (email: string, name: string, couponCode: string, discountValue?: number, maxDiscount?: number, minOrder?: number, expiresAt?: Date) => Promise<boolean>;
/**
 * Promotional Broadcast Email
 */
export declare const sendPromotionalEmail: (email: string, subject: string, promoTitle: string, promoBody: string, ctaUrl?: string, ctaText?: string) => Promise<boolean>;
/**
 * Low Stock Admin Alert Email
 */
export declare const sendLowStockNotificationEmail: (adminEmail: string, items: Array<{
    name: string;
    sku?: string;
    stock: number;
    threshold: number;
}>) => Promise<boolean>;
/**
 * New Order Admin Alert Email
 */
export declare const sendNewOrderAdminNotificationEmail: (adminEmail: string, order: {
    orderNumber: string;
    totalAmount: number;
    customerName?: string;
    customerEmail: string;
}) => Promise<boolean>;
/**
 * Failed Payment Admin Alert Email
 */
export declare const sendFailedPaymentAdminAlert: (adminEmail: string, orderNumber: string, amount: number, reason?: string) => Promise<boolean>;
/**
 * System Health Alert Email
 */
export declare const sendSystemAlertEmail: (adminEmail: string, subject: string, alertDetails: string) => Promise<boolean>;
//# sourceMappingURL=email.d.ts.map