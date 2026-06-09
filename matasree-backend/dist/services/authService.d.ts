/**
 * Auth Service
 * Handles token generation, refresh token management, and OAuth token issuance
 * Separates business logic from controller layer
 */
import { Response } from 'express';
/**
 * Issue new access + refresh tokens for a user
 * Stores refresh token in DB and sets HTTP-only cookie
 */
export declare const issueTokens: (user: {
    _id: any;
    email: string;
    role: string;
}, res: Response, meta?: {
    userAgent?: string;
    ipAddress?: string;
}) => Promise<{
    accessToken: string;
    refreshToken: string;
}>;
/**
 * Rotate refresh token - issue new pair, revoke old
 * Implements refresh token rotation for security
 */
export declare const rotateRefreshToken: (oldRefreshToken: string, res: Response, meta?: {
    userAgent?: string;
    ipAddress?: string;
}) => Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
        id: import("mongoose").Types.ObjectId;
        name: string;
        email: string;
        role: "customer" | "admin";
        avatar: string | undefined;
        isAdmin: boolean;
    };
}>;
/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export declare const revokeAllTokens: (userId: string) => Promise<void>;
/**
 * Revoke specific refresh token (single session logout)
 */
export declare const revokeToken: (token: string) => Promise<void>;
/**
 * Clear refresh token cookie
 */
export declare const clearRefreshCookie: (res: Response) => void;
//# sourceMappingURL=authService.d.ts.map