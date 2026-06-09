import mongoose from 'mongoose';
export interface ICoupon {
    _id: mongoose.Types.ObjectId;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount: number;
    maxDiscount: number;
    email: string;
    userId?: mongoose.Types.ObjectId;
    isUsed: boolean;
    usedAt?: Date;
    usedOrderId?: mongoose.Types.ObjectId;
    expiresAt: Date;
    source: 'newsletter' | 'admin' | 'promotion';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICoupon, {}, {}, {}, mongoose.Document<unknown, {}, ICoupon, {}, {}> & ICoupon & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Coupon.d.ts.map