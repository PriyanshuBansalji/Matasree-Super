import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
/**
 * Create an order
 */
export declare const createOrder: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Verify Razorpay payment
 */
export declare const verifyPayment: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get user's orders
 */
export declare const getOrders: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get order by ID
 */
export declare const getOrderById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get all orders (Admin)
 */
export declare const getAllOrders: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Update order status (Admin)
 */
export declare const updateOrderStatus: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=orderController.d.ts.map