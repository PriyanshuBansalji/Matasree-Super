/**
 * Referral Routes
 * Mounts the referral controller endpoints.
 *
 * GET  /api/referral/my-code  — returns the authenticated user's referral code
 * GET  /api/referral/history  — lists all referrals made by the authenticated user
 * POST /api/referral/apply    — applies a referral code for the authenticated user
 *
 * Requirements: 11.5
 */
import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { getMyCode, getReferralHistory, applyCode } from '../controllers/referralController';

const router = Router();

/**
 * GET /api/referral/my-code
 * Returns { referralCode } for the logged-in user.
 * Requires: verifyToken
 */
router.get('/my-code', verifyToken, getMyCode as any);

/**
 * GET /api/referral/history
 * Returns all referrals the logged-in user has made, with referee info and reward status.
 * Requires: verifyToken
 */
router.get('/history', verifyToken, getReferralHistory as any);

/**
 * POST /api/referral/apply
 * Body: { code: string }
 * Applies a referral code on behalf of the authenticated user.
 * Requires: verifyToken (code is linked to the calling user's account)
 */
router.post('/apply', verifyToken, applyCode as any);

export default router;
