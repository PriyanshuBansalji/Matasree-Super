"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRefreshCookie = exports.revokeToken = exports.revokeAllTokens = exports.rotateRefreshToken = exports.issueTokens = void 0;
const RefreshToken_1 = __importDefault(require("../models/RefreshToken"));
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../config/logger"));
// Cookie options for refresh token
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true, // Prevent XSS access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax'),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
};
/**
 * Issue new access + refresh tokens for a user
 * Stores refresh token in DB and sets HTTP-only cookie
 *
 * @param options.oauthFlow - When true, marks the refresh token as pending
 *   an OAuth token exchange. The token is consumed exactly once by GET /api/auth/token.
 */
const issueTokens = async (user, res, meta, options) => {
    const userId = user._id.toString();
    // Generate tokens
    const accessToken = (0, jwt_1.generateAccessToken)(userId, user.email, user.role);
    const refreshToken = (0, jwt_1.generateRefreshToken)(userId);
    // Calculate expiry (7 days from now)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    // Store refresh token in database
    await RefreshToken_1.default.create({
        userId: user._id,
        token: refreshToken,
        expiresAt,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
        oauthPending: options?.oauthFlow === true,
    });
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    logger_1.default.info(`Tokens issued for user: ${user.email}`);
    return { accessToken, refreshToken };
};
exports.issueTokens = issueTokens;
/**
 * Rotate refresh token - issue new pair, revoke old
 * Implements refresh token rotation for security
 */
const rotateRefreshToken = async (oldRefreshToken, res, meta) => {
    // Verify the old refresh token
    const decoded = (0, jwt_1.verifyRefreshToken)(oldRefreshToken);
    const userId = decoded.userId;
    // Find the stored token
    const storedToken = await RefreshToken_1.default.findOne({
        token: oldRefreshToken,
        isRevoked: false,
    });
    if (!storedToken) {
        // Token reuse detected - potential theft!
        // Revoke ALL tokens for this user as a safety measure
        await RefreshToken_1.default.updateMany({ userId }, { isRevoked: true });
        logger_1.default.warn(`⚠️  Refresh token reuse detected for user: ${userId}. All tokens revoked.`);
        throw new Error('Token reuse detected. All sessions revoked for security.');
    }
    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
        storedToken.isRevoked = true;
        await storedToken.save();
        throw new Error('Refresh token expired. Please log in again.');
    }
    // Revoke old token
    storedToken.isRevoked = true;
    await storedToken.save();
    // Issue new tokens
    // We need to get the user details to generate access token
    const User = (await Promise.resolve().then(() => __importStar(require('../models/User')))).default;
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    const accessToken = (0, jwt_1.generateAccessToken)(userId, user.email, user.role);
    const newRefreshToken = (0, jwt_1.generateRefreshToken)(userId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    // Store new refresh token
    await RefreshToken_1.default.create({
        userId,
        token: newRefreshToken,
        expiresAt,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
    });
    // Set new cookie
    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);
    logger_1.default.info(`Refresh token rotated for user: ${user.email}`);
    return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
        },
    };
};
exports.rotateRefreshToken = rotateRefreshToken;
/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
const revokeAllTokens = async (userId) => {
    const result = await RefreshToken_1.default.updateMany({ userId, isRevoked: false }, { isRevoked: true });
    logger_1.default.info(`Revoked ${result.modifiedCount} refresh tokens for user: ${userId}`);
};
exports.revokeAllTokens = revokeAllTokens;
/**
 * Revoke specific refresh token (single session logout)
 */
const revokeToken = async (token) => {
    await RefreshToken_1.default.findOneAndUpdate({ token }, { isRevoked: true });
};
exports.revokeToken = revokeToken;
/**
 * Clear refresh token cookie
 */
const clearRefreshCookie = (res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/',
    });
};
exports.clearRefreshCookie = clearRefreshCookie;
//# sourceMappingURL=authService.js.map