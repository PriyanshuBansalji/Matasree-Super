/**
 * Referral Model
 * Records the relationship between a referrer (code owner) and a referee
 * (new user who signed up using the code).
 */
import mongoose from 'mongoose';
export type ReferralStatus = 'pending' | 'rewarded';
export interface IReferral {
    _id: mongoose.Types.ObjectId;
    referrerId: mongoose.Types.ObjectId;
    refereeId: mongoose.Types.ObjectId;
    code: string;
    status: ReferralStatus;
    rewardedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IReferral, {}, {}, {}, mongoose.Document<unknown, {}, IReferral, {}, {}> & IReferral & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Referral.d.ts.map