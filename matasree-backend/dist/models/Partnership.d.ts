import mongoose from 'mongoose';
export interface IPartnership {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    fullName: string;
    email: string;
    phone: string;
    businessName: string;
    businessType: 'sole-proprietorship' | 'partnership' | 'pvt-ltd' | 'llp' | 'other';
    areaOfInterest: string;
    cities: string[];
    businessExperience: number;
    bankAccountHolder: string;
    bankAccountNumber: string;
    ifscCode: string;
    gstNumber: string;
    businessRegistration: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    additionalInfo?: string;
    status: 'pending' | 'approved' | 'rejected' | 'on-hold';
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPartnership, {}, {}, {}, mongoose.Document<unknown, {}, IPartnership, {}, {}> & IPartnership & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Partnership.d.ts.map