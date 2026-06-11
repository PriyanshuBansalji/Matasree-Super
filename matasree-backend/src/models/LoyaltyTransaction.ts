/**
 * LoyaltyTransaction Model
 * Immutable ledger of every loyalty point change for a user.
 * Positive delta = earn; negative delta = redeem or reversal.
 */
import mongoose, { Schema } from 'mongoose';

export type LoyaltyTransactionReason =
  | 'order_earn'
  | 'order_cancel'
  | 'referral_bonus'
  | 'redemption';

export interface ILoyaltyTransaction {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  delta: number;           // positive = earn, negative = redeem/reverse
  reason: LoyaltyTransactionReason;
  balanceAfter: number;    // snapshot of account balance immediately after this transaction
  createdAt: Date;
}

const loyaltyTransactionSchema = new Schema<ILoyaltyTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    delta: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      enum: ['order_earn', 'order_cancel', 'referral_bonus', 'redemption'],
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    // No updatedAt — transactions are immutable
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Primary query: user's transaction history ordered newest-first
loyaltyTransactionSchema.index({ userId: 1, createdAt: -1 }, { background: true });
// Support lookup by order (e.g., to reverse points on cancellation)
loyaltyTransactionSchema.index({ orderId: 1 }, { background: true });

export default mongoose.model<ILoyaltyTransaction>('LoyaltyTransaction', loyaltyTransactionSchema);
