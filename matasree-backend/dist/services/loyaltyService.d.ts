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
export declare function awardLoyaltyPoints(orderId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId, subtotalPaid: number): Promise<number>;
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
export declare function redeemLoyaltyPoints(userId: mongoose.Types.ObjectId, pointsRequested: number, orderSubtotal: number): Promise<number>;
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
export declare function reverseLoyaltyPoints(orderId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<void>;
//# sourceMappingURL=loyaltyService.d.ts.map