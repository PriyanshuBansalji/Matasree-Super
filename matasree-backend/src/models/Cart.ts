import mongoose, { Schema } from 'mongoose';

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  addedAt: Date;
}

export interface ICart {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  abandonmentEmailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    abandonmentEmailSentAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICart>('Cart', cartSchema);
