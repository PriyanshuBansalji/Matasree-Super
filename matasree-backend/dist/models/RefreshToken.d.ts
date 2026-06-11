/**
 * RefreshToken Model
 * Stores refresh tokens in MongoDB for secure token rotation
 * Supports token blacklisting and automatic expiry cleanup
 */
import mongoose, { Document } from 'mongoose';
export interface IRefreshToken extends Document {
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: Date;
    isRevoked: boolean;
    userAgent?: string;
    ipAddress?: string;
    /** Set to true when issued via OAuth flow; cleared after first /api/auth/token exchange */
    oauthPending?: boolean;
    createdAt: Date;
}
declare const _default: mongoose.Model<IRefreshToken, {}, {}, {}, mongoose.Document<unknown, {}, IRefreshToken, {}, {}> & IRefreshToken & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=RefreshToken.d.ts.map