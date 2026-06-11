/**
 * Referral Model
 * Records the relationship between a referrer (code owner) and a referee
 * (new user who signed up using the code).
 */
import mongoose, { Schema } from 'mongoose';

export type ReferralStatus = 'pending' | 'rewarded';

export interface IReferral {
  _id: mongoose.Types.ObjectId;
  referrerId: mongoose.Types.ObjectId;  // the user who shared the code
  refereeId: mongoose.Types.ObjectId;   // the user who used the code
  code: string;                         // referrer's referral code at time of use
  status: ReferralStatus;
  rewardedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refereeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'rewarded'],
      default: 'pending',
    },
    rewardedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// List all referrals made by a given referrer
referralSchema.index({ referrerId: 1 }, { background: true });
// A referee can only use one referral code — one entry per new user
referralSchema.index({ refereeId: 1 }, { unique: true, background: true });
// Look up referrals by code (e.g., during validation)
referralSchema.index({ code: 1 }, { background: true });

export default mongoose.model<IReferral>('Referral', referralSchema);
