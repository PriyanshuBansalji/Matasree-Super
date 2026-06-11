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
import mongoose from 'mongoose';
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
export declare function generateReferralCode(userId: mongoose.Types.ObjectId): Promise<string>;
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
export declare function applyReferralCode(newUserId: mongoose.Types.ObjectId, code: string): Promise<void>;
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
export declare function rewardReferrer(refereeId: mongoose.Types.ObjectId): Promise<void>;
//# sourceMappingURL=referralService.d.ts.map