import mongoose, { Schema } from 'mongoose';

export interface IPayment {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  cashfreePaymentId?: string;
  cashfreeOrderId?: string;
  cfPaymentId?: string;
  signature?: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'refund_initiated' | 'refunded';
  method: 'cashfree' | 'cod' | 'razorpay';
  rawGatewayResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cashfreePaymentId: String,
    cashfreeOrderId: String,
    cfPaymentId: String,
    signature: String,
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refund_initiated', 'refunded'],
      default: 'pending',
    },
    method: {
      type: String,
      enum: ['cashfree', 'cod', 'razorpay'],
      required: true,
    },
    rawGatewayResponse: Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Indexes for order and user payment lookups
paymentSchema.index({ orderId: 1 }, { background: true });
paymentSchema.index({ cashfreeOrderId: 1 }, { background: true });
paymentSchema.index({ userId: 1, status: 1 }, { background: true });

export default mongoose.model<IPayment>('Payment', paymentSchema);
