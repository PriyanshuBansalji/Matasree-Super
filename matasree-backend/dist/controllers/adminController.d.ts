import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
/**
 * Get dashboard statistics (Admin)
 */
export declare const getDashboardStats: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get all users (Admin)
 */
export declare const getAllUsers: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get revenue analytics (Admin)
 */
export declare const getRevenueAnalytics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get payment summary (Admin)
 */
export declare const getPaymentSummary: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map