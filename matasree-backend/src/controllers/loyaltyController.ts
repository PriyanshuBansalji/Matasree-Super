/**
 * Loyalty Controller
 * Handles balance enquiry, transaction history, and point redemption for authenticated users.
 *
 * Requirements: 10.4
 */

import { Response } from 'express';
import mongoose from 'mongoose';
import LoyaltyAccount from '../models/LoyaltyAccount';
import LoyaltyTransaction from '../models/LoyaltyTransaction';
import { redeemLoyaltyPoints } from '../services/loyaltyService';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../utils/response';
import logger from '../config/logger';

// ---------------------------------------------------------------------------
// GET /api/loyalty/balance
// Returns the current points balance for the authenticated user.
// If no loyalty account exists yet, returns zeroed-out defaults.
// ---------------------------------------------------------------------------

/**
 * Get loyalty balance for the authenticated user.
 *
 * Response: { success: true, data: { balance, lifetimeEarned, lifetimeRedeemed } }
 */
export const getLoyaltyBalance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    const account = await LoyaltyAccount.findOne({ userId });

    const data = account
      ? {
          balance: account.balance,
          lifetimeEarned: account.lifetimeEarned,
          lifetimeRedeemed: account.lifetimeRedeemed,
        }
      : {
          balance: 0,
          lifetimeEarned: 0,
          lifetimeRedeemed: 0,
        };

    return res.status(200).json(new ApiResponse(true, 'Loyalty balance fetched', data));
  } catch (error: any) {
    logger.error('[loyaltyController] getLoyaltyBalance error:', error);
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to fetch loyalty balance', null, 500));
  }
};

// ---------------------------------------------------------------------------
// GET /api/loyalty/transactions?page=1&limit=10
// Returns a paginated, newest-first list of the user's loyalty transactions.
// ---------------------------------------------------------------------------

/**
 * Get paginated loyalty transaction history for the authenticated user.
 *
 * Query params: page (default 1), limit (default 10)
 * Response: { success: true, data: { transactions, pagination: { total, page, limit } } }
 */
export const getLoyaltyTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10) || 10));
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      LoyaltyTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LoyaltyTransaction.countDocuments({ userId }),
    ]);

    return res.status(200).json(
      new ApiResponse(true, 'Loyalty transactions fetched', {
        transactions,
        pagination: { total, page, limit },
      })
    );
  } catch (error: any) {
    logger.error('[loyaltyController] getLoyaltyTransactions error:', error);
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to fetch loyalty transactions', null, 500));
  }
};

// ---------------------------------------------------------------------------
// POST /api/loyalty/redeem
// Body: { pointsRequested: number, orderSubtotal: number }
// Calls redeemLoyaltyPoints from loyaltyService and returns the discount amount.
// ---------------------------------------------------------------------------

/**
 * Redeem loyalty points at checkout.
 *
 * Body: { pointsRequested: number, orderSubtotal: number }
 * Response: { success: true, data: { discountAmount } }
 * Errors: 400 on insufficient balance or invalid input
 */
export const redeemPoints = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pointsRequested, orderSubtotal } = req.body;

    // Validate inputs
    if (
      typeof pointsRequested !== 'number' ||
      !Number.isInteger(pointsRequested) ||
      pointsRequested < 1
    ) {
      return res
        .status(400)
        .json(new ApiResponse(false, 'pointsRequested must be a positive integer', null, 400));
    }

    if (typeof orderSubtotal !== 'number' || orderSubtotal < 0) {
      return res
        .status(400)
        .json(new ApiResponse(false, 'orderSubtotal must be a non-negative number', null, 400));
    }

    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    const discountAmount = await redeemLoyaltyPoints(userId, pointsRequested, orderSubtotal);

    return res.status(200).json(
      new ApiResponse(true, 'Loyalty points redeemed successfully', { discountAmount })
    );
  } catch (error: any) {
    // Forward HTTP 400 errors from the service layer as 400 responses
    if (error.status === 400) {
      return res
        .status(400)
        .json(new ApiResponse(false, error.message || 'Redemption failed', null, 400));
    }

    logger.error('[loyaltyController] redeemPoints error:', error);
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to redeem loyalty points', null, 500));
  }
};
