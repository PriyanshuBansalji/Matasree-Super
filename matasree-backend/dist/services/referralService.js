"use strict";
/**
 * Referral Service
 * Handles referral code generation, application, and reward distribution.
 *
 * Flow:
 *   1. generateReferralCode — called on registration; assigns a unique 8-char code to the user
 *   2. applyReferralCode    — called when a new user provides a referral code at sign-up
 *   3. rewardReferrer       — called from the order payment hook on the referee's first paid order;
 *                             credits 50 loyalty points to the referrer and marks the referral rewarded
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.6
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReferralCode = generateReferralCode;
exports.applyReferralCode = applyReferralCode;
exports.rewardReferrer = rewardReferrer;
const User_1 = __importDefault(require("../models/User"));
const Referral_1 = __importDefault(require("../models/Referral"));
const LoyaltyAccount_1 = __importDefault(require("../models/LoyaltyAccount"));
const LoyaltyTransaction_1 = __importDefault(require("../models/LoyaltyTransaction"));
const email_1 = require("../utils/email");
const logger_1 = __importDefault(require("../config/logger"));
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
/**
 * Character set that avoids visually ambiguous characters
 * (no 0/O, 1/I/L) to reduce transcription errors.
 */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const MAX_RETRIES = 10;
const REFERRAL_BONUS_POINTS = 50;
// ---------------------------------------------------------------------------
// Error helper — attaches an HTTP status code for controller forwarding
// ---------------------------------------------------------------------------
function createHttpError(message, status) {
    const err = new Error(message);
    err.status = status;
    return err;
}
// ---------------------------------------------------------------------------
// Internal helper — generate one random code string
// ---------------------------------------------------------------------------
function randomCode() {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
}
// ---------------------------------------------------------------------------
// 1. generateReferralCode
// ---------------------------------------------------------------------------
/**
 * Generate a unique 8-character alphanumeric referral code and assign it to
 * the given user document.
 *
 * Uniqueness is guaranteed by checking `User.findOne({ referralCode: code })`
 * with up to 10 retry attempts on collision. In practice, the collision
 * probability with the 32-char alphabet across the expected user base is
 * negligible; retries are a safety net.
 *
 * @param userId - MongoDB ObjectId of the newly registered user
 *
 * Validates: Requirement 11.1
 */
async function generateReferralCode(userId) {
    let code = '';
    let attempts = 0;
    while (attempts < MAX_RETRIES) {
        const candidate = randomCode();
        const existing = await User_1.default.findOne({ referralCode: candidate });
        if (!existing) {
            code = candidate;
            break;
        }
        attempts++;
    }
    if (!code) {
        // Extremely unlikely — all 10 candidates collided
        logger_1.default.error(`[referralService] generateReferralCode: failed to generate unique code for user ${userId.toString()} after ${MAX_RETRIES} attempts`);
        throw new Error('Could not generate a unique referral code. Please try again.');
    }
    // Persist the code to the user document
    await User_1.default.updateOne({ _id: userId }, { referralCode: code });
    logger_1.default.info(`[referralService] generateReferralCode: assigned code "${code}" to user ${userId.toString()}`);
    return code;
}
// ---------------------------------------------------------------------------
// 2. applyReferralCode
// ---------------------------------------------------------------------------
/**
 * Apply a referral code on behalf of a newly registered user.
 *
 * Validates that:
 *   - The code belongs to a real user  (400 if not found)
 *   - The referee is not the referrer  (400 self-referral guard)
 *
 * Creates a `Referral` document with `status: 'pending'`. The reward is not
 * issued here — it is issued later, on the referee's first paid order via
 * `rewardReferrer`.
 *
 * @param newUserId - ObjectId of the user who typed the code
 * @param code      - The referral code string to validate
 *
 * Validates: Requirements 11.2, 11.3, 11.4
 */
async function applyReferralCode(newUserId, code) {
    // Normalise to uppercase to be forgiving about user input
    const normalisedCode = code.trim().toUpperCase();
    // Look up the referrer by their referral code
    const referrer = await User_1.default.findOne({ referralCode: normalisedCode });
    if (!referrer) {
        throw createHttpError('Invalid referral code', 400);
    }
    // Prevent self-referral
    if (referrer._id.equals(newUserId)) {
        throw createHttpError('You cannot use your own referral code', 400);
    }
    // Create the pending referral record
    // The unique index on refereeId prevents a user from applying multiple codes
    await Referral_1.default.create({
        referrerId: referrer._id,
        refereeId: newUserId,
        code: normalisedCode,
        status: 'pending',
    });
    logger_1.default.info(`[referralService] applyReferralCode: referral pending — referrer ${referrer._id.toString()} ← referee ${newUserId.toString()} (code: "${normalisedCode}")`);
}
// ---------------------------------------------------------------------------
// 3. rewardReferrer
// ---------------------------------------------------------------------------
/**
 * Credit the referrer with 50 loyalty points when their referee places their
 * first paid order.
 *
 * If no pending referral exists for the given `refereeId`, the function returns
 * silently (idempotent — safe to call on every paid order and let the unique
 * `refereeId` index / status check guard against double rewards).
 *
 * Steps:
 *   1. Find `Referral` with `{ refereeId, status: 'pending' }`
 *   2. Upsert `LoyaltyAccount` — credit +50 balance and lifetimeEarned
 *   3. Create `LoyaltyTransaction` with reason `'referral_bonus'`
 *   4. Send notification email to the referrer
 *   5. Mark referral `status: 'rewarded'` and set `rewardedAt`
 *
 * @param refereeId - ObjectId of the user whose first paid order triggered this
 *
 * Validates: Requirements 11.3, 11.6
 */
async function rewardReferrer(refereeId) {
    // Look for a pending referral where this user was the referee
    const referral = await Referral_1.default.findOne({ refereeId, status: 'pending' });
    if (!referral) {
        // No pending referral — nothing to do
        return;
    }
    const referrerId = referral.referrerId;
    // Credit 50 loyalty points to the referrer's account (upsert if missing)
    const account = await LoyaltyAccount_1.default.findOneAndUpdate({ userId: referrerId }, { $inc: { balance: REFERRAL_BONUS_POINTS, lifetimeEarned: REFERRAL_BONUS_POINTS } }, { upsert: true, new: true });
    // Record the immutable ledger entry
    await LoyaltyTransaction_1.default.create({
        userId: referrerId,
        delta: REFERRAL_BONUS_POINTS,
        reason: 'referral_bonus',
        balanceAfter: account.balance,
    });
    // Send email notification to the referrer
    const referrer = await User_1.default.findById(referrerId);
    if (referrer?.email) {
        await (0, email_1.sendEmail)({
            email: referrer.email,
            subject: 'You earned a referral bonus! 🎉 | Matasree',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background-color: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #ff8c00; }
            .highlight { background-color: #fff8f0; border: 2px solid #ff8c00; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center; }
            .points { font-size: 36px; font-weight: bold; color: #ff8c00; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌶️ Matasree</div>
              <p style="color: #666; margin-top: 5px;">Premium Spices &amp; Masalas</p>
            </div>

            <h2 style="color: #333; text-align: center;">Your referral paid off!</h2>
            <p style="color: #555; font-size: 14px; text-align: center;">
              A friend you referred just completed their first order on Matasree.
              As a thank-you, we've added loyalty points to your account.
            </p>

            <div class="highlight">
              <p style="color: #666; margin: 0 0 8px 0; font-size: 13px;">REFERRAL BONUS CREDITED</p>
              <div class="points">+${REFERRAL_BONUS_POINTS} points</div>
              <p style="color: #ff8c00; margin: 8px 0 0 0; font-size: 13px;">New balance: ${account.balance} points</p>
            </div>

            <p style="color: #555; font-size: 14px; text-align: center;">
              Use your points at checkout — every 2 points gives you ₹1 off your next order!
            </p>

            <div class="footer">
              <p>© 2026 Matasree. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        });
    }
    // Mark the referral as rewarded
    await Referral_1.default.updateOne({ _id: referral._id }, { status: 'rewarded', rewardedAt: new Date() });
    logger_1.default.info(`[referralService] rewardReferrer: +${REFERRAL_BONUS_POINTS} pts credited to referrer ${referrerId.toString()} ` +
        `(referee ${refereeId.toString()}, balance now ${account.balance})`);
}
//# sourceMappingURL=referralService.js.map