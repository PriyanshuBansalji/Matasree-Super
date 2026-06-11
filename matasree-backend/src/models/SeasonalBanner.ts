/**
 * SeasonalBanner Model
 * Admin-managed promotional banners with an active date range.
 * Frontend filters client-side by current date within activeFrom–activeTo.
 */
import mongoose, { Schema } from 'mongoose';

export interface ISeasonalBanner {
  _id: mongoose.Types.ObjectId;
  image: string;       // Cloudinary URL
  title: string;
  subtitle?: string;
  ctaLink: string;
  ctaText: string;
  activeFrom: Date;
  activeTo: Date;
  createdAt: Date;
  updatedAt: Date;
}

const seasonalBannerSchema = new Schema<ISeasonalBanner>(
  {
    image: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    ctaLink: {
      type: String,
      required: true,
      trim: true,
    },
    ctaText: {
      type: String,
      required: true,
      trim: true,
    },
    activeFrom: {
      type: Date,
      required: true,
    },
    activeTo: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Efficiently fetch banners active within a given date range
seasonalBannerSchema.index({ activeFrom: 1, activeTo: 1 }, { background: true });

export default mongoose.model<ISeasonalBanner>('SeasonalBanner', seasonalBannerSchema);
