import Razorpay from 'razorpay';
export declare const razorpayInstance: Razorpay;
export declare const createRazorpayOrder: (amount: number, orderId: string) => Promise<import("razorpay/dist/types/orders").Orders.RazorpayOrder>;
export declare const verifyRazorpaySignature: (orderId: string, paymentId: string, signature: string) => boolean;
//# sourceMappingURL=razorpay.d.ts.map