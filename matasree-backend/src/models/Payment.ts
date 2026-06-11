import mongoose, { Schema } from 'mongoose';

export interface IPayment {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'refund_initiated';
  method: 'razorpay' | 'cod';
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
    razorpayPaymentId: String,
    razorpayOrderId: String,
    razorpaySignature: String,
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refund_initiated'],
      default: 'pending',
    },
    method: {
      type: String,
      enum: ['razorpay', 'cod'],
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for order and user payment lookups
paymentSchema.index({ orderId: 1 }, { background: true });
paymentSchema.index({ userId: 1, status: 1 }, { background: true });

export default mongoose.model<IPayment>('Payment', paymentSchema);
