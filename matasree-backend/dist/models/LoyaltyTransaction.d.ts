/**
 * LoyaltyTransaction Model
 * Immutable ledger of every loyalty point change for a user.
 * Positive delta = earn; negative delta = redeem or reversal.
 */
import mongoose from 'mongoose';
export type LoyaltyTransactionReason = 'order_earn' | 'order_cancel' | 'referral_bonus' | 'redemption';
export interface ILoyaltyTransaction {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    delta: number;
    reason: LoyaltyTransactionReason;
    balanceAfter: number;
    createdAt: Date;
}
declare const _default: mongoose.Model<ILoyaltyTransaction, {}, {}, {}, mongoose.Document<unknown, {}, ILoyaltyTransaction, {}, {}> & ILoyaltyTransaction & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=LoyaltyTransaction.d.ts.map