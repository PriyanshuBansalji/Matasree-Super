import mongoose, { Schema } from 'mongoose';

export interface IProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: Schema.Types.ObjectId;
  stock: number;
  rating: number;
  reviews: number;
  sold?: number;
  image: string;
  images?: string[];
  weight: string;
  tags?: string[];
  isNewProduct?: boolean;
  isBestseller?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    image: {
      type: String,
      required: true,
    },
    images: [String],
    weight: {
      type: String,
      required: true,
      enum: ['100g', '250g', '500g', '1kg', '2kg'],
    },
    tags: [String],
    isNewProduct: {
      type: Boolean,
      default: false,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IProduct>('Product', productSchema);
