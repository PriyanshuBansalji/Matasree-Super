/**
 * Loyalty Service
 * Pure-function engine for awarding, redeeming, and reversing loyalty points.
 *
 * Point economics:
 *   - Earn:   1 point per ₹10 spent  (FLOOR(subtotal / 10))
 *   - Redeem: ₹0.50 discount per point redeemed
 *   - Cap:    redemption discount ≤ 50% of order subtotal
 *
 * Requirements: 10.1, 10.2, 10.3, 10.5, 10.6
 */

import mongoose from 'mongoose';
import LoyaltyAccount from '../models/LoyaltyAccount';
import LoyaltyTransaction from '../models/LoyaltyTransaction';
import Order from '../models/Order';
import logger from '../config/logger';

// ---------------------------------------------------------------------------
// Error helper — attaches an HTTP status code so controllers can forward it
// ---------------------------------------------------------------------------
function createHttpError(message: string, status: number): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

// ---------------------------------------------------------------------------
// 1. awardLoyaltyPoints
//    Called when an order payment is confirmed (or COD delivered).
//    Upserts LoyaltyAccount, records LoyaltyTransaction, updates Order.
//    Returns the user's updated balance.
// ---------------------------------------------------------------------------

/**
 * Award loyalty points to a user for a paid order.
 *
 * @param orderId      - MongoDB ObjectId of the order
 * @param userId       - MongoDB ObjectId of the customer
 * @param subtotalPaid - Order subtotal in INR (before shipping, after discounts)
 * @returns            Updated loyalty account balance
 *
 * Validates: Requirements 10.1, 10.5
 */
export async function awardLoyaltyPoints(
  orderId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  subtotalPaid: number
): Promise<number> {
  const pointsToAward = Math.floor(subtotalPaid / 10);

  // If subtotal is too small to earn any points, return the existing balance unchanged
  if (pointsToAward === 0) {
    const existing = await LoyaltyAccount.findOne({ userId });
    logger.info(
      `[loyaltyService] awardLoyaltyPoints: 0 points for order ${orderId.toString()} (subtotal ₹${subtotalPaid})`
    );
    return existing?.balance ?? 0;
  }

  // Upsert the account and atomically increment balance + lifetimeEarned
  const account = await LoyaltyAccount.findOneAndUpdate(
    { userId },
    { $inc: { balance: pointsToAward, lifetimeEarned: pointsToAward } },
    { upsert: true, new: true }
  );

  // Record the immutable ledger entry
  await LoyaltyTransaction.create({
    userId,
    orderId,
    delta: pointsToAward,
    reason: 'order_earn',
    balanceAfter: account.balance,
  });

  // Stamp the order with how many points were earned
  await Order.updateOne(
    { _id: orderId },
    { loyaltyPointsEarned: pointsToAward }
  );

  logger.info(
    `[loyaltyService] awardLoyaltyPoints: +${pointsToAward} pts for user ${userId.toString()} ` +
    `(order ${orderId.toString()}, balance now ${account.balance})`
  );

  return account.balance;
}

// ---------------------------------------------------------------------------
// 2. redeemLoyaltyPoints
//    Called at checkout when the customer chooses to apply loyalty points.
//    Returns the monetary discount amount (INR) to subtract from the order total.
// ---------------------------------------------------------------------------

/**
 * Redeem loyalty points for a discount at checkout.
 *
 * @param userId           - MongoDB ObjectId of the customer
 * @param pointsRequested  - Number of points the customer wants to redeem
 * @param orderSubtotal    - Current order subtotal in INR (used to enforce 50% cap)
 * @returns                Discount amount in INR to apply to the order
 * @throws                 HTTP 400 when balance is insufficient
 *
 * Validates: Requirements 10.2, 10.6
 */
export async function redeemLoyaltyPoints(
  userId: mongoose.Types.ObjectId,
  pointsRequested: number,
  orderSubtotal: number
): Promise<number> {
  const account = await LoyaltyAccount.findOne({ userId });

  // Guard: account must exist and have enough balance
  if (!account || account.balance < pointsRequested) {
    throw createHttpError('Insufficient loyalty points', 400);
  }

  // ₹0.50 per point — cap the monetary discount at 50% of the order subtotal
  const maxRedeemableDiscount = orderSubtotal * 0.5;
  const requestedDiscount = pointsRequested * 0.5;
  const discountAmount = Math.min(requestedDiscount, maxRedeemableDiscount);

  // Recalculate effective points actually consumed (in case the cap reduced the discount)
  const effectivePoints = Math.floor(discountAmount / 0.5);

  // Decrement balance and increment lifetime redeemed
  account.balance -= effectivePoints;
  account.lifetimeRedeemed += effectivePoints;
  await account.save();

  // Record the ledger entry (negative delta = redemption)
  await LoyaltyTransaction.create({
    userId,
    delta: -effectivePoints,
    reason: 'redemption',
    balanceAfter: account.balance,
  });

  logger.info(
    `[loyaltyService] redeemLoyaltyPoints: -${effectivePoints} pts for user ${userId.toString()} ` +
    `(discount ₹${discountAmount}, balance now ${account.balance})`
  );

  return discountAmount;
}

// ---------------------------------------------------------------------------
// 3. reverseLoyaltyPoints
//    Called when an order is cancelled (via PUT /api/orders/:id/cancel).
//    Finds the original earn transaction and creates a negative reversal entry.
// ---------------------------------------------------------------------------

/**
 * Reverse the loyalty points earned for a cancelled order.
 *
 * If no earn transaction is found (e.g., the order was below the earn threshold)
 * the function returns silently without error.
 *
 * @param orderId - MongoDB ObjectId of the cancelled order
 * @param userId  - MongoDB ObjectId of the customer
 *
 * Validates: Requirements 10.3
 */
export async function reverseLoyaltyPoints(
  orderId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
): Promise<void> {
  // Find the original earn transaction for this order
  const earnTransaction = await LoyaltyTransaction.findOne({
    orderId,
    reason: 'order_earn',
  });

  // Nothing to reverse if no earn transaction exists
  if (!earnTransaction) {
    logger.info(
      `[loyaltyService] reverseLoyaltyPoints: no earn transaction found for order ${orderId.toString()} — nothing to reverse`
    );
    return;
  }

  const pointsToReverse = earnTransaction.delta; // always positive for 'order_earn'

  // Atomically decrement the balance
  const updatedAccount = await LoyaltyAccount.findOneAndUpdate(
    { userId },
    { $inc: { balance: -pointsToReverse } },
    { new: true }
  );

  if (!updatedAccount) {
    // Should not happen if data is consistent; log and bail rather than throw
    logger.warn(
      `[loyaltyService] reverseLoyaltyPoints: LoyaltyAccount not found for user ${userId.toString()} ` +
      `while reversing order ${orderId.toString()}`
    );
    return;
  }

  // Record the cancellation reversal (negative delta)
  await LoyaltyTransaction.create({
    userId,
    orderId,
    delta: -pointsToReverse,
    reason: 'order_cancel',
    balanceAfter: updatedAccount.balance,
  });

  logger.info(
    `[loyaltyService] reverseLoyaltyPoints: -${pointsToReverse} pts for user ${userId.toString()} ` +
    `(order ${orderId.toString()} cancelled, balance now ${updatedAccount.balance})`
  );
}
