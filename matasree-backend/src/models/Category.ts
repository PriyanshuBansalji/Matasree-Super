import mongoose, { Schema } from 'mongoose';

export interface ICategory {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a category name'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      sparse: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>('Category', categorySchema);
