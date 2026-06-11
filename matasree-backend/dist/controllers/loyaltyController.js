"use strict";
/**
 * Loyalty Controller
 * Handles balance enquiry, transaction history, and point redemption for authenticated users.
 *
 * Requirements: 10.4
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redeemPoints = exports.getLoyaltyTransactions = exports.getLoyaltyBalance = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const LoyaltyAccount_1 = __importDefault(require("../models/LoyaltyAccount"));
const LoyaltyTransaction_1 = __importDefault(require("../models/LoyaltyTransaction"));
const loyaltyService_1 = require("../services/loyaltyService");
const response_1 = require("../utils/response");
const logger_1 = __importDefault(require("../config/logger"));
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
const getLoyaltyBalance = async (req, res) => {
    try {
        const userId = new mongoose_1.default.Types.ObjectId(req.user.userId);
        const account = await LoyaltyAccount_1.default.findOne({ userId });
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
        return res.status(200).json(new response_1.ApiResponse(true, 'Loyalty balance fetched', data));
    }
    catch (error) {
        logger_1.default.error('[loyaltyController] getLoyaltyBalance error:', error);
        return res
            .status(500)
            .json(new response_1.ApiResponse(false, error.message || 'Failed to fetch loyalty balance', null, 500));
    }
};
exports.getLoyaltyBalance = getLoyaltyBalance;
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
const getLoyaltyTransactions = async (req, res) => {
    try {
        const userId = new mongoose_1.default.Types.ObjectId(req.user.userId);
        const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10) || 10));
        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            LoyaltyTransaction_1.default.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            LoyaltyTransaction_1.default.countDocuments({ userId }),
        ]);
        return res.status(200).json(new response_1.ApiResponse(true, 'Loyalty transactions fetched', {
            transactions,
            pagination: { total, page, limit },
        }));
    }
    catch (error) {
        logger_1.default.error('[loyaltyController] getLoyaltyTransactions error:', error);
        return res
            .status(500)
            .json(new response_1.ApiResponse(false, error.message || 'Failed to fetch loyalty transactions', null, 500));
    }
};
exports.getLoyaltyTransactions = getLoyaltyTransactions;
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
const redeemPoints = async (req, res) => {
    try {
        const { pointsRequested, orderSubtotal } = req.body;
        // Validate inputs
        if (typeof pointsRequested !== 'number' ||
            !Number.isInteger(pointsRequested) ||
            pointsRequested < 1) {
            return res
                .status(400)
                .json(new response_1.ApiResponse(false, 'pointsRequested must be a positive integer', null, 400));
        }
        if (typeof orderSubtotal !== 'number' || orderSubtotal < 0) {
            return res
                .status(400)
                .json(new response_1.ApiResponse(false, 'orderSubtotal must be a non-negative number', null, 400));
        }
        const userId = new mongoose_1.default.Types.ObjectId(req.user.userId);
        const discountAmount = await (0, loyaltyService_1.redeemLoyaltyPoints)(userId, pointsRequested, orderSubtotal);
        return res.status(200).json(new response_1.ApiResponse(true, 'Loyalty points redeemed successfully', { discountAmount }));
    }
    catch (error) {
        // Forward HTTP 400 errors from the service layer as 400 responses
        if (error.status === 400) {
            return res
                .status(400)
                .json(new response_1.ApiResponse(false, error.message || 'Redemption failed', null, 400));
        }
        logger_1.default.error('[loyaltyController] redeemPoints error:', error);
        return res
            .status(500)
            .json(new response_1.ApiResponse(false, error.message || 'Failed to redeem loyalty points', null, 500));
    }
};
exports.redeemPoints = redeemPoints;
//# sourceMappingURL=loyaltyController.js.map