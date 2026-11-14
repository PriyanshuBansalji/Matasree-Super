import { Response } from 'express';
/**
 * Create an order
 */
export declare const createOrder: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Verify Razorpay payment
 */
export declare const verifyPayment: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get user's orders
 */
export declare const getOrders: (req: any, res: Response) => Promise<void>;
/**
 * Get order by ID
 */
export declare const getOrderById: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Cancel an order (Customer)
 * Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6
 */
export declare const cancelOrder: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get all orders (Admin)
 */
export declare const getAllOrders: (req: any, res: Response) => Promise<void>;
/**
 * Update order status (Admin)
 */
export declare const updateOrderStatus: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Download GST Tax Invoice HTML / PDF
 */
export declare const downloadInvoice: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Process Razorpay Refund (Admin)
 */
export declare const processRefund: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=orderController.d.ts.map