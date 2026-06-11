import { Response } from 'express';
/**
 * Get dashboard statistics (Admin)
 */
export declare const getDashboardStats: (req: any, res: Response) => Promise<void>;
/**
 * Get all users (Admin)
 */
export declare const getAllUsers: (req: any, res: Response) => Promise<void>;
/**
 * Get revenue analytics (Admin)
 */
export declare const getRevenueAnalytics: (req: any, res: Response) => Promise<void>;
/**
 * Get payment summary (Admin)
 */
export declare const getPaymentSummary: (req: any, res: Response) => Promise<void>;
/**
 * Update user role (Admin)
 */
export declare const updateUserRole: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete user (Admin)
 */
export declare const deleteUser: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=adminController.d.ts.map