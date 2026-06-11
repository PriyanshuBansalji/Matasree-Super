/**
 * Recipe Model
 * Stores Indian recipes that can be linked to spice products via productTags.
 * Supports filtering by regional cuisine and product association.
 */
import mongoose, { Schema } from 'mongoose';

export type RecipeRegion =
  | 'North Indian'
  | 'South Indian'
  | 'Bengali'
  | 'Rajasthani'
  | 'Other';

export interface IRecipe {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  productTags: string[];   // product names or slugs used for cross-linking
  region: RecipeRegion;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const recipeSchema = new Schema<IRecipe>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    ingredients: {
      type: [String],
      default: [],
    },
    steps: {
      type: [String],
      default: [],
    },
    productTags: {
      type: [String],
      default: [],
    },
    region: {
      type: String,
      enum: ['North Indian', 'South Indian', 'Bengali', 'Rajasthani', 'Other'],
      required: true,
    },
    image: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Filter recipes by associated product tags
recipeSchema.index({ productTags: 1 }, { background: true });
// Filter recipes by regional cuisine
recipeSchema.index({ region: 1 }, { background: true });

export default mongoose.model<IRecipe>('Recipe', recipeSchema);
