import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
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
export declare const getRevenueAnalytics: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
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
export declare const deleteUser: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/admin/abandonment-config (Admin)
 * Returns the current cart abandonment configuration.
 * Requirements: 14.5
 */
export declare const getAbandonmentConfig: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * PUT /api/admin/abandonment-config (Admin)
 * Updates the cart abandonment window and optional coupon code.
 * Requirements: 14.5
 */
export declare const updateAbandonmentConfig: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/admin/recipes (public)
 * Returns paginated recipes, optionally filtered by tag and/or region.
 */
export declare const getRecipes: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/admin/recipes (admin-only)
 */
export declare const createRecipe: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * PUT /api/admin/recipes/:id (admin-only)
 */
export declare const updateRecipe: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * DELETE /api/admin/recipes/:id (admin-only)
 */
export declare const deleteRecipe: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/admin/banners (public)
 * Returns all seasonal banners; client filters by activeFrom/activeTo.
 */
export declare const getSeasonalBanners: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/admin/banners (admin-only)
 */
export declare const createBanner: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * PUT /api/admin/banners/:id (admin-only)
 */
export declare const updateBanner: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * DELETE /api/admin/banners/:id (admin-only)
 */
export declare const deleteBanner: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/admin/products/low-stock (Admin)
 * Phase 3, Req 11.3
 */
export declare const getLowStockProducts: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/admin/coupons/analytics (Admin)
 * Phase 3, Req 12.2
 */
export declare const getCouponAnalytics: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/admin/products/top-selling (Admin)
 * Phase 3, Req 14.3
 */
export declare const getTopSellingProducts: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=adminController.d.ts.map