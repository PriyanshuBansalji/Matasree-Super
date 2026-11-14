import mongoose from 'mongoose';
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
    paymentMethod: 'razorpay' | 'cod';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    paymentId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
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
declare const _default: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Order.d.ts.map