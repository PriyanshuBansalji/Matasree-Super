/**
 * Wishlist Model
 * Stores a user's saved products. Each user has at most one wishlist document.
 */
import mongoose from 'mongoose';
export interface IWishlistItem {
    productId: mongoose.Types.ObjectId;
    addedAt: Date;
}
export interface IWishlist {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    items: IWishlistItem[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IWishlist, {}, {}, {}, mongoose.Document<unknown, {}, IWishlist, {}, {}> & IWishlist & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Wishlist.d.ts.map