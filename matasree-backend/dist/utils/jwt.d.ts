import { JwtPayload } from 'jsonwebtoken';
export interface ITokenPayload extends JwtPayload {
    userId: string;
    email: string;
    role: 'admin' | 'customer';
}
export declare const generateAccessToken: (userId: string, email: string, role: string) => string;
export declare const generateRefreshToken: (userId: string) => string;
export declare const verifyAccessToken: (token: string) => ITokenPayload;
export declare const verifyRefreshToken: (token: string) => JwtPayload;
//# sourceMappingURL=jwt.d.ts.map