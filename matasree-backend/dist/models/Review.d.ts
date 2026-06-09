import mongoose from 'mongoose';
export interface IReview {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    productId?: mongoose.Types.ObjectId;
    name: string;
    email?: string;
    rating: number;
    comment: string;
    isApproved: boolean;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IReview, {}, {}, {}, mongoose.Document<unknown, {}, IReview, {}, {}> & IReview & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Review.d.ts.map