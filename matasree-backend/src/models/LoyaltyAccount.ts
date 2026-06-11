/**
 * LoyaltyAccount Model
 * Tracks the loyalty points balance for each user.
 * One account document per user; upserted on first point award.
 */
import mongoose, { Schema } from 'mongoose';

export interface ILoyaltyAccount {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  balance: number;           // current redeemable points, always >= 0
  lifetimeEarned: number;    // cumulative points ever earned
  lifetimeRedeemed: number;  // cumulative points ever redeemed
  createdAt: Date;
  updatedAt: Date;
}

const loyaltyAccountSchema = new Schema<ILoyaltyAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeRedeemed: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// One loyalty account per user
loyaltyAccountSchema.index({ userId: 1 }, { unique: true, background: true });

export default mongoose.model<ILoyaltyAccount>('LoyaltyAccount', loyaltyAccountSchema);
