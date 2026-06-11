/**
 * Loyalty Routes
 * All routes require a valid JWT (verifyToken).
 *
 * GET  /api/loyalty/balance       — current points balance
 * GET  /api/loyalty/transactions  — paginated transaction history
 * POST /api/loyalty/redeem        — redeem points for a discount
 *
 * Requirements: 10.4
 */
import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import {
  getLoyaltyBalance,
  getLoyaltyTransactions,
  redeemPoints,
} from '../controllers/loyaltyController';

const router = Router();

// All loyalty endpoints require authentication
router.use(verifyToken);

/**
 * GET /api/loyalty/balance
 * Returns { balance, lifetimeEarned, lifetimeRedeemed } for the logged-in user.
 * Returns zeros if no loyalty account exists yet.
 */
router.get('/balance', getLoyaltyBalance as any);

/**
 * GET /api/loyalty/transactions?page=1&limit=10
 * Returns paginated, newest-first transaction history.
 */
router.get('/transactions', getLoyaltyTransactions as any);

/**
 * POST /api/loyalty/redeem
 * Body: { pointsRequested: number, orderSubtotal: number }
 * Returns { discountAmount } in INR.
 */
router.post('/redeem', redeemPoints as any);

export default router;
