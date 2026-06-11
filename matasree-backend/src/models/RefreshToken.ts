/**
 * RefreshToken Model
 * Stores refresh tokens in MongoDB for secure token rotation
 * Supports token blacklisting and automatic expiry cleanup
 */
import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  userAgent?: string;
  ipAddress?: string;
  /** Set to true when issued via OAuth flow; cleared after first /api/auth/token exchange */
  oauthPending?: boolean;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index - auto-delete expired tokens
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    userAgent: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    oauthPending: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index for efficient lookups
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });

export default mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
