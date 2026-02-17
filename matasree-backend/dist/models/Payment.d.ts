import mongoose from 'mongoose';
export interface IPayment {
    _id: mongoose.Types.ObjectId;
    orderId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
    amount: number;
    status: 'pending' | 'success' | 'failed';
    method: 'razorpay' | 'cod';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Payment.d.ts.map