/**
 * Loyalty Controller
 * Handles balance enquiry, transaction history, and point redemption for authenticated users.
 *
 * Requirements: 10.4
 */
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
/**
 * Get loyalty balance for the authenticated user.
 *
 * Response: { success: true, data: { balance, lifetimeEarned, lifetimeRedeemed } }
 */
export declare const getLoyaltyBalance: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get paginated loyalty transaction history for the authenticated user.
 *
 * Query params: page (default 1), limit (default 10)
 * Response: { success: true, data: { transactions, pagination: { total, page, limit } } }
 */
export declare const getLoyaltyTransactions: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Redeem loyalty points at checkout.
 *
 * Body: { pointsRequested: number, orderSubtotal: number }
 * Response: { success: true, data: { discountAmount } }
 * Errors: 400 on insufficient balance or invalid input
 */
export declare const redeemPoints: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=loyaltyController.d.ts.map