import mongoose from 'mongoose';
import Review from '../models/Review';
import Product from '../models/Product';

/**
 * Recalculates Product.rating and Product.reviews from approved reviews.
 * Req 7.1, 7.2, 7.3, 7.4, 7.5
 */
export async function recalculateProductRating(
  productId: mongoose.Types.ObjectId | string
): Promise<void> {
  const agg = await Review.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(String(productId)),
        isApproved: true,
      },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const avgRating = agg.length > 0 ? agg[0].avgRating : 0;
  const count = agg.length > 0 ? agg[0].count : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: parseFloat(avgRating.toFixed(2)),
    reviews: count,
  });
}
