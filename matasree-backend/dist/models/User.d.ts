/**
 * User Model - Enhanced for OAuth + Local Auth
 * Supports Google, GitHub, and email/password authentication
 * Role-based access control: admin | customer
 */
import mongoose from 'mongoose';
export interface IUser {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    phone: string;
    role: 'customer' | 'admin';
    isAdmin: boolean;
    avatar?: string;
    provider: 'local' | 'google' | 'github';
    providerId?: string;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map