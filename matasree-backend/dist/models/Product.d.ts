import mongoose, { Schema } from 'mongoose';
export interface IProduct {
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    category: Schema.Types.ObjectId;
    stock: number;
    rating: number;
    reviews: number;
    sold?: number;
    image: string;
    images?: string[];
    weight: string;
    tags?: string[];
    isNewProduct?: boolean;
    isBestseller?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct, {}, {}> & IProduct & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Product.d.ts.map