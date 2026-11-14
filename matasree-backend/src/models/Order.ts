import mongoose, { Schema } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
  weight?: string;
}

export interface IOrder {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  totalAmount: number;
  shippingCharge?: number;
  shippingAddress: {
    name: string;
    fullName?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentMethod: 'cashfree' | 'cod' | 'razorpay';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;
  cashfreeOrderId?: string;
  paymentSessionId?: string;
  cashfreePaymentId?: string;
  cfPaymentId?: string;
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  webhookResponse?: Record<string, any>;
  refundIds?: string[];
  settlementStatus?: string;
  orderstatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  couponCode?: string;
  discountAmount?: number;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  loyaltyDiscountAmount?: number;
  stockReservedAt?: Date | null;
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
        weight: String,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingCharge: {
      type: Number,
      default: 0,
    },
    shippingAddress: {
      name: String,
      fullName: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
    },
    paymentMethod: {
      type: String,
      enum: ['cashfree', 'cod', 'razorpay'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentId: String,
    cashfreeOrderId: String,
    paymentSessionId: String,
    cashfreePaymentId: String,
    cfPaymentId: String,
    transactionId: String,
    gatewayResponse: Schema.Types.Mixed,
    webhookResponse: Schema.Types.Mixed,
    refundIds: [String],
    settlementStatus: String,
    orderstatus: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'],
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
    stockReservedAt: {
      type: Date,
      default: null,
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
orderSchema.index({ cashfreeOrderId: 1 }, { background: true });
orderSchema.index({ userId: 1, orderstatus: 1 }, { background: true });
orderSchema.index({ createdAt: -1, orderstatus: 1 }, { background: true });

export default mongoose.model<IOrder>('Order', orderSchema);
