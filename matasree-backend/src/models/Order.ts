import mongoose, { Schema } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface IOrder {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  totalAmount: number;
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentId?: string;
  orderstatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  couponCode?: string;
  discountAmount?: number;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  loyaltyDiscountAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Types.ObjectId,
          ref: 'Product',
        },
        name: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      name: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentId: String,
    orderstatus: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    couponCode: {
      type: String,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    loyaltyPointsEarned: {
      type: Number,
    },
    loyaltyPointsRedeemed: {
      type: Number,
    },
    loyaltyDiscountAmount: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Indexes for common query patterns
orderSchema.index({ userId: 1, createdAt: -1 }, { background: true });
orderSchema.index({ orderstatus: 1 }, { background: true });

export default mongoose.model<IOrder>('Order', orderSchema);
