/**
 * LoyaltyAccount Model
 * Tracks the loyalty points balance for each user.
 * One account document per user; upserted on first point award.
 */
import mongoose from 'mongoose';
export interface ILoyaltyAccount {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    balance: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ILoyaltyAccount, {}, {}, {}, mongoose.Document<unknown, {}, ILoyaltyAccount, {}, {}> & ILoyaltyAccount & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=LoyaltyAccount.d.ts.map