/**
 * Referral Controller
 * Exposes endpoints for referral code retrieval, history, and code application.
 *
 * Routes:
 *   GET  /api/referral/my-code  — returns the authenticated user's referral code
 *   GET  /api/referral/history  — lists all referrals made by the authenticated user
 *   POST /api/referral/apply    — applies a referral code for a (newly) registered user
 *
 * Requirements: 11.5
 */

import { Response } from 'express';
import mongoose from 'mongoose';
import Joi from 'joi';
import User from '../models/User';
import Referral from '../models/Referral';
import { applyReferralCode } from '../services/referralService';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../utils/response';
import logger from '../config/logger';

// ---------------------------------------------------------------------------
// Joi schema — POST /apply
// ---------------------------------------------------------------------------
const applyCodeSchema = Joi.object({
  code: Joi.string().trim().required().messages({
    'string.empty': 'Referral code is required',
    'any.required': 'Referral code is required',
  }),
});

// ---------------------------------------------------------------------------
// GET /api/referral/my-code
// Returns the referral code for the authenticated user.
// The code is stored on the User document (generated at registration).
// ---------------------------------------------------------------------------

/**
 * Get the authenticated user's own referral code.
 *
 * Response: { success: true, data: { referralCode: string } }
 *
 * Validates: Requirement 11.5
 */
export const getMyCode = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    const user = await User.findById(userId).select('referralCode').lean();
    if (!user) {
      return res.status(404).json(new ApiResponse(false, 'User not found', null, 404));
    }

    return res.status(200).json(
      new ApiResponse(true, 'Referral code fetched', { referralCode: user.referralCode ?? null })
    );
  } catch (error: any) {
    logger.error('[referralController] getMyCode error:', error);
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to fetch referral code', null, 500));
  }
};

// ---------------------------------------------------------------------------
// GET /api/referral/history
// Lists all Referral documents where the authenticated user is the referrer.
// Populates referee name/email for display purposes.
// ---------------------------------------------------------------------------

/**
 * Get the referral history for the authenticated user (as referrer).
 *
 * Response: { success: true, data: { referrals: [...] } }
 * Each entry contains: refereeId (populated), code, status, rewardedAt, createdAt
 *
 * Validates: Requirement 11.5
 */
export const getReferralHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const referrerId = new mongoose.Types.ObjectId(req.user!.userId);

    const referrals = await Referral.find({ referrerId })
      .populate('refereeId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const data = referrals.map((r) => ({
      _id: r._id,
      referee: r.refereeId, // populated: { _id, name, email }
      code: r.code,
      status: r.status,
      rewardedAt: r.rewardedAt ?? null,
      createdAt: r.createdAt,
    }));

    return res.status(200).json(
      new ApiResponse(true, 'Referral history fetched', { referrals: data })
    );
  } catch (error: any) {
    logger.error('[referralController] getReferralHistory error:', error);
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to fetch referral history', null, 500));
  }
};

// ---------------------------------------------------------------------------
// POST /api/referral/apply
// Public route — allows a newly registered user to apply a referral code.
// Body: { code: string }
// ---------------------------------------------------------------------------

/**
 * Apply a referral code on behalf of the authenticated user.
 *
 * Body: { code: string }
 * Response: { success: true, message: 'Referral code applied successfully' }
 * Errors: 400 on invalid code, self-referral, or already-used code
 *
 * Validates: Requirement 11.5
 */
export const applyCode = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { error, value } = applyCodeSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { code } = value;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    await applyReferralCode(userId, code);

    return res
      .status(200)
      .json(new ApiResponse(true, 'Referral code applied successfully', null));
  } catch (error: any) {
    // Service layer attaches HTTP status codes for expected business errors
    const status = error.status === 400 ? 400 : 500;
    logger.error('[referralController] applyCode error:', error);
    return res
      .status(status)
      .json(new ApiResponse(false, error.message || 'Failed to apply referral code', null, status));
  }
};
