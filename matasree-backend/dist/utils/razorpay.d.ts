export declare const razorpayInstance: any;
export declare const createRazorpayOrder: (amount: number, orderId: string) => Promise<any>;
export declare const verifyRazorpaySignature: (orderId: string, paymentId: string, signature: string) => boolean;
/**
 * Verify Razorpay Webhook HMAC SHA256 signature
 */
export declare const verifyRazorpayWebhookSignature: (payloadBody: string, signature: string, secret?: string) => boolean;
/**
 * Fetch Payment details from Razorpay API
 */
export declare const fetchRazorpayPayment: (paymentId: string) => Promise<any>;
/**
 * Issue Refund via Razorpay Refund API
 */
export declare const createRazorpayRefund: (paymentId: string, amount?: number, // in INR (optional - full refund if omitted)
notes?: Record<string, any>) => Promise<any>;
//# sourceMappingURL=razorpay.d.ts.map