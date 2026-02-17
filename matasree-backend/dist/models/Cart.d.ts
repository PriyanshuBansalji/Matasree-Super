import mongoose from 'mongoose';
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
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICart, {}, {}, {}, mongoose.Document<unknown, {}, ICart, {}, {}> & ICart & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Cart.d.ts.map