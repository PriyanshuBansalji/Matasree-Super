import mongoose from 'mongoose';
export interface IAddress {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IAddress, {}, {}, {}, mongoose.Document<unknown, {}, IAddress, {}, {}> & IAddress & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Address.d.ts.map