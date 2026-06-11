/**
 * User Model - Enhanced for OAuth + Local Auth
 * Supports Google, GitHub, and email/password authentication
 * Role-based access control: admin | customer
 */
import mongoose, { Schema } from 'mongoose';

export interface IRecentlyViewedEntry {
  productId: mongoose.Types.ObjectId;
  viewedAt: Date;
}

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'customer' | 'admin';
  /** @deprecated Use `role === 'admin'` for admin checks. This field is redundant with `role` and will be removed in a future release. */
  isAdmin: boolean;
  avatar?: string;
  // OAuth fields
  provider: 'local' | 'google' | 'github';
  providerId?: string;
  isEmailVerified: boolean;
  referralCode: string;
  loyaltyAccountId?: mongoose.Types.ObjectId;
  recentlyViewed: IRecentlyViewedEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
      // Password not required for OAuth users
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    /** @deprecated Use `role === 'admin'` for admin checks. This field is redundant with `role` and will be removed in a future release. */
    isAdmin: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
    },
    // OAuth provider tracking
    provider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },
    providerId: {
      type: String,
      sparse: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    loyaltyAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'LoyaltyAccount',
    },
    // Recently viewed products — sliding window of 10, ordered by viewedAt desc
    recentlyViewed: {
      type: [
        {
          productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
          viewedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes for performance
userSchema.index({ provider: 1, providerId: 1 });
userSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', userSchema);
