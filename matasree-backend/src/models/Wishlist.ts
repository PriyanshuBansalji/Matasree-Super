/**
 * Wishlist Model
 * Stores a user's saved products. Each user has at most one wishlist document.
 */
import mongoose, { Schema } from 'mongoose';

export interface IWishlistItem {
  productId: mongoose.Types.ObjectId;
  addedAt: Date;
}

export interface IWishlist {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Unique per user — one wishlist document per user
wishlistSchema.index({ userId: 1 }, { unique: true, background: true });
// Support queries filtering by product across all wishlists
wishlistSchema.index({ 'items.productId': 1 }, { background: true });

export default mongoose.model<IWishlist>('Wishlist', wishlistSchema);
