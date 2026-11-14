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
exports.resetPassword = exports.verifyPasswordResetOtp = exports.sendPasswordResetOtp = exports.resendMobileOtp = exports.verifyMobileOtp = exports.sendMobileOtp = exports.resendEmailOtp = exports.verifyEmailOtp = exports.sendEmailOtp = exports.updateProfile = exports.getProfile = exports.logoutAll = exports.logout = exports.getOAuthToken = exports.oauthCallback = exports.refreshToken = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const password_1 = require("../utils/password");
const response_1 = require("../utils/response");
const email_1 = require("../utils/email");
const authService_1 = require("../services/authService");
const logger_1 = __importDefault(require("../config/logger"));
const joi_1 = __importDefault(require("joi"));
const redis_1 = require("../config/redis");
const auditLogger_1 = require("../middleware/auditLogger");
// Redis helper functions for OAuth and OTP storage
const OTP_TTL_SECONDS = 300; // 5 minutes
const OAUTH_TOKEN_TTL_SECONDS = 300; // 5 minutes
async function saveOTP(key, otp) {
    const data = JSON.stringify({ otp, attempts: 0 });
    await redis_1.redisClient.set(key, data, 'EX', OTP_TTL_SECONDS);
}
async function getOTP(key) {
    const data = await redis_1.redisClient.get(key);
    if (!data)
        return null;
    try {
        return JSON.parse(data);
    }
    catch {
        return null;
    }
}
async function updateOTPAttempts(key, stored) {
    const data = JSON.stringify({ otp: stored.otp, attempts: stored.attempts + 1 });
    await redis_1.redisClient.set(key, data, 'EX', OTP_TTL_SECONDS);
}
async function deleteOTP(key) {
    await redis_1.redisClient.del(key);
}
async function saveOAuthToken(userId, accessToken, user) {
    const key = `oauth:${userId}`;
    const data = JSON.stringify({ accessToken, user });
    await redis_1.redisClient.set(key, data, 'EX', OAUTH_TOKEN_TTL_SECONDS);
}
async function getAndConsumeOAuthToken(userId) {
    const key = `oauth:${userId}`;
    const data = await redis_1.redisClient.get(key);
    if (!data)
        return null;
    await redis_1.redisClient.del(key);
    try {
        return JSON.parse(data);
    }
    catch {
        return null;
    }
}
// ============================================================
// VALIDATION SCHEMAS
// ============================================================
const registerSchema = joi_1.default.object({
    name: joi_1.default.string().required().trim().min(2).max(100),
    email: joi_1.default.string().email().required().lowercase(),
    password: joi_1.default.string().min(6).max(128).required(),
    phone: joi_1.default.string().optional(),
});
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().lowercase(),
    password: joi_1.default.string().required(),
});
const updateProfileSchema = joi_1.default.object({
    name: joi_1.default.string().trim().min(2).max(100).optional(),
    phone: joi_1.default.string().trim().optional(),
});
const sendEmailOtpSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().lowercase(),
});
const verifyEmailOtpSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().lowercase(),
    otp: joi_1.default.string().length(6).required(),
});
const sendMobileOtpSchema = joi_1.default.object({
    mobile: joi_1.default.string().required().trim(),
});
const verifyMobileOtpSchema = joi_1.default.object({
    mobile: joi_1.default.string().required().trim(),
    otp: joi_1.default.string().length(6).required(),
});
const sendPasswordResetOtpSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().lowercase(),
});
const verifyPasswordResetOtpSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().lowercase(),
    otp: joi_1.default.string().length(6).required(),
});
const resetPasswordSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().lowercase(),
    otp: joi_1.default.string().length(6).required(),
    newPassword: joi_1.default.string().min(6).max(128).required(),
});
// ============================================================
// LOCAL AUTH (Email + Password)
// ============================================================
/**
 * Register a new user with email/password
 */
const register = async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { name, email, password, phone } = value;
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Email already registered', null, 400));
        }
        // Hash password
        const hashedPassword = await (0, password_1.hashPassword)(password);
        // Create user
        const user = await User_1.default.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role: 'customer',
            provider: 'local',
        });
        // Issue tokens (access + refresh with HTTP-only cookie)
        const { accessToken } = await (0, authService_1.issueTokens)(user, res, {
            ...(req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : {}),
            ...(req.ip ? { ipAddress: req.ip } : {}),
        });
        logger_1.default.info(`New user registered: ${email}`);
        // Send Welcome Email asynchronously
        (0, email_1.sendWelcomeEmail)(user.email, user.name).catch((err) => logger_1.default.error(`Failed to send welcome email to ${email}:`, err));
        res.status(201).json(new response_1.ApiResponse(true, 'Registration successful', {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                isAdmin: user.role === 'admin',
            },
            accessToken,
        }));
    }
    catch (error) {
        logger_1.default.error('Registration error:', error);
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Registration failed', null, 500));
    }
};
exports.register = register;
/**
 * Login user with email/password
 */
const login = async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { email, password } = value;
        // Find user with password field
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json(new response_1.ApiResponse(false, 'Invalid email or password', null, 401));
        }
        // Check if account is locked out
        if (user.lockUntil && user.lockUntil > new Date()) {
            const lockTimeRemainingLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
            return res.status(423).json(new response_1.ApiResponse(false, `Account is temporarily locked. Try again in ${lockTimeRemainingLeft} minute(s).`, null, 423));
        }
        // Check if user signed up via OAuth (no password set)
        if (user.provider !== 'local' && !user.password) {
            user.loginHistory.push({
                ip: req.ip || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown',
                timestamp: new Date(),
                success: false,
            });
            if (user.loginHistory.length > 20)
                user.loginHistory.shift();
            await user.save();
            return res.status(400).json(new response_1.ApiResponse(false, `This account uses ${user.provider} login. Please sign in with ${user.provider}.`, null, 400));
        }
        // Compare password
        const isPasswordValid = await (0, password_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            user.failedLoginAttempts += 1;
            user.loginHistory.push({
                ip: req.ip || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown',
                timestamp: new Date(),
                success: false,
            });
            if (user.loginHistory.length > 20)
                user.loginHistory.shift();
            if (user.failedLoginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
                await user.save();
                return res.status(423).json(new response_1.ApiResponse(false, 'Too many failed login attempts. Account locked for 15 minutes.', null, 423));
            }
            await user.save();
            const remainingAttemptsLeft = 5 - user.failedLoginAttempts;
            return res.status(401).json(new response_1.ApiResponse(false, `Invalid email or password. ${remainingAttemptsLeft} attempt(s) remaining before lockout.`, null, 401));
        }
        // Check for suspicious login: successful logins exist, but none from this specific IP & user agent combination
        const hasPriorSuccessfulLogins = user.loginHistory.some(history => history.success);
        const isKnownDeviceOrIp = !hasPriorSuccessfulLogins || user.loginHistory.some(history => history.success &&
            history.ip === (req.ip || 'unknown') &&
            history.userAgent === (req.headers['user-agent'] || 'unknown'));
        if (!isKnownDeviceOrIp) {
            await (0, auditLogger_1.logSecurityEvent)(user._id.toString(), 'SUSPICIOUS_LOGIN_DETECTED', 'User', user._id.toString(), {
                ip: req.ip || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown',
                message: 'Login from a new IP or device combination'
            }, req);
            logger_1.default.warn(`⚠️ Suspicious login detected for user ${user.email} from IP: ${req.ip || 'unknown'}`);
        }
        // Login successful - Reset failed login attempts, update login meta
        user.failedLoginAttempts = 0;
        user.set('lockUntil', undefined);
        user.lastLoginAt = new Date();
        user.lastLoginIp = req.ip || 'unknown';
        user.loginHistory.push({
            ip: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            timestamp: new Date(),
            success: true,
        });
        if (user.loginHistory.length > 20)
            user.loginHistory.shift();
        await user.save();
        // Issue tokens
        const { accessToken } = await (0, authService_1.issueTokens)(user, res, {
            ...(req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : {}),
            ...(req.ip ? { ipAddress: req.ip } : {}),
        });
        logger_1.default.info(`User logged in: ${email}`);
        res.status(200).json(new response_1.ApiResponse(true, 'Login successful', {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                isAdmin: user.role === 'admin',
            },
            accessToken,
        }));
    }
    catch (error) {
        logger_1.default.error('Login error:', error);
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Login failed', null, 500));
    }
};
exports.login = login;
// ============================================================
// TOKEN REFRESH
// ============================================================
/**
 * Refresh access token using refresh token from HTTP-only cookie
 * Implements token rotation for security
 */
const refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            return res.status(401).json(new response_1.ApiResponse(false, 'No refresh token provided', null, 401));
        }
        const result = await (0, authService_1.rotateRefreshToken)(token, res, {
            ...(req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : {}),
            ...(req.ip ? { ipAddress: req.ip } : {}),
        });
        res.status(200).json(new response_1.ApiResponse(true, 'Token refreshed', {
            user: result.user,
            accessToken: result.accessToken,
        }));
    }
    catch (error) {
        (0, authService_1.clearRefreshCookie)(res);
        logger_1.default.error('Token refresh error:', error.message);
        res.status(401).json(new response_1.ApiResponse(false, error.message || 'Token refresh failed', null, 401));
    }
};
exports.refreshToken = refreshToken;
// ============================================================
// OAUTH CALLBACK HANDLER
// ============================================================
/**
 * Handle OAuth callback (used for both Google and GitHub)
 * Stores token in memory and redirects to frontend without token in URL
 * Frontend fetches token from GET /api/auth/token endpoint
 */
const oauthCallback = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8000'}/login?error=auth_failed`);
        }
        // Issue tokens (refresh token set as httpOnly cookie by issueTokens)
        const { accessToken } = await (0, authService_1.issueTokens)(user, res, {
            ...(req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : {}),
            ...(req.ip ? { ipAddress: req.ip } : {}),
        });
        // Store token in Redis for one-time retrieval by frontend (expires in 5 minutes)
        await saveOAuthToken(user._id.toString(), accessToken, {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            isAdmin: user.role === 'admin',
        });
        // Redirect to frontend WITHOUT token in URL (secure against URL history leaks)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
        const redirectUrl = `${frontendUrl}/auth/callback`;
        logger_1.default.info(`OAuth login successful: ${user.email} (${user.provider}), token stored for retrieval`);
        res.redirect(redirectUrl);
    }
    catch (error) {
        logger_1.default.error('OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8000'}/login?error=auth_failed`);
    }
};
exports.oauthCallback = oauthCallback;
// ============================================================
// OAUTH TOKEN RETRIEVAL (secure, one-time, cookie-authenticated)
// ============================================================
/**
 * Get OAuth access token (called by frontend after OAuth redirect)
 * Returns token exactly once, then destroys it
 * Requires valid httpOnly refresh cookie from OAuth flow
 */
const getOAuthToken = async (req, res) => {
    try {
        // Authenticate via the httpOnly refresh-token cookie (no Bearer token available yet)
        const refreshTokenCookie = req.cookies?.refreshToken;
        if (!refreshTokenCookie) {
            return res.status(401).json(new response_1.ApiResponse(false, 'No session found. Please log in again.', null, 401));
        }
        // Verify the refresh token to get the userId
        const { verifyRefreshToken } = await Promise.resolve().then(() => __importStar(require('../utils/jwt')));
        let decoded;
        try {
            decoded = verifyRefreshToken(refreshTokenCookie);
        }
        catch {
            return res.status(401).json(new response_1.ApiResponse(false, 'Invalid session. Please log in again.', null, 401));
        }
        const userId = decoded.userId?.toString();
        if (!userId) {
            return res.status(401).json(new response_1.ApiResponse(false, 'Unauthorized', null, 401));
        }
        const tokenData = await getAndConsumeOAuthToken(userId);
        // Token not found or expired
        if (!tokenData) {
            return res.status(401).json(new response_1.ApiResponse(false, 'No token available or expired. Please log in again.', null, 401));
        }
        const { accessToken, user } = tokenData;
        logger_1.default.info(`OAuth token retrieved and consumed for user ${userId}`);
        res.status(200).json(new response_1.ApiResponse(true, 'OAuth token retrieved', {
            accessToken,
            user,
        }));
    }
    catch (error) {
        logger_1.default.error('Get OAuth token error:', error);
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to retrieve OAuth token', null, 500));
    }
};
exports.getOAuthToken = getOAuthToken;
// ============================================================
// LOGOUT
// ============================================================
/**
 * Logout user - revoke refresh token and clear cookie
 */
const logout = async (req, res) => {
    try {
        const authReq = req;
        const refreshTokenFromCookie = req.cookies?.refreshToken || authReq.cookies?.refreshToken;
        // Revoke the specific refresh token
        if (refreshTokenFromCookie) {
            await (0, authService_1.revokeToken)(refreshTokenFromCookie);
        }
        // Clear the cookie
        (0, authService_1.clearRefreshCookie)(res);
        logger_1.default.info(`User logged out: ${authReq.user?.userId}`);
        res.status(200).json(new response_1.ApiResponse(true, 'Logout successful'));
    }
    catch (error) {
        logger_1.default.error('Logout error:', error);
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Logout failed', null, 500));
    }
};
exports.logout = logout;
/**
 * Logout from all devices - revoke ALL refresh tokens
 */
const logoutAll = async (req, res) => {
    try {
        const authReq = req;
        if (authReq.user?.userId) {
            await (0, authService_1.revokeAllTokens)(authReq.user.userId);
        }
        (0, authService_1.clearRefreshCookie)(res);
        logger_1.default.info(`User logged out from all devices: ${authReq.user?.userId}`);
        res.status(200).json(new response_1.ApiResponse(true, 'Logged out from all devices'));
    }
    catch (error) {
        logger_1.default.error('Logout all error:', error);
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Logout failed', null, 500));
    }
};
exports.logoutAll = logoutAll;
// ============================================================
// PROFILE
// ============================================================
/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
    try {
        const authReq = req;
        const user = await User_1.default.findById(authReq.user?.userId);
        if (!user) {
            return res.status(404).json(new response_1.ApiResponse(false, 'User not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Profile fetched', {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar,
            provider: user.provider,
            isEmailVerified: user.isEmailVerified,
            isAdmin: user.role === 'admin',
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch profile', null, 500));
    }
};
exports.getProfile = getProfile;
/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
    try {
        const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { name, phone } = value;
        const authReq = req;
        const user = await User_1.default.findByIdAndUpdate(authReq.user?.userId, { name, phone }, { new: true });
        if (!user) {
            return res.status(404).json(new response_1.ApiResponse(false, 'User not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Profile updated', {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to update profile', null, 500));
    }
};
exports.updateProfile = updateProfile;
/// ============================================================
// OTP SYSTEM (Kept from original - using Redis client wrapper)
// ============================================================
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/** Send email OTP */
const sendEmailOtp = async (req, res) => {
    try {
        const { error, value } = sendEmailOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { email } = value;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser)
            return res.status(400).json(new response_1.ApiResponse(false, 'Email already registered', null, 400));
        const otp = generateOTP();
        const key = `otp:email:${email}`;
        await saveOTP(key, otp);
        const emailSent = await (0, email_1.sendOTPEmail)(email, otp);
        if (!emailSent) {
            await deleteOTP(key);
            return res.status(500).json(new response_1.ApiResponse(false, 'Failed to send OTP email', null, 500));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'OTP sent to email', {
            email,
            otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to send email OTP', null, 500));
    }
};
exports.sendEmailOtp = sendEmailOtp;
/** Verify email OTP */
const verifyEmailOtp = async (req, res) => {
    try {
        const { error, value } = verifyEmailOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { email, otp } = value;
        const key = `otp:email:${email}`;
        const stored = await getOTP(key);
        if (!stored)
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP not found or expired', null, 400));
        if (stored.attempts >= 3) {
            await deleteOTP(key);
            return res.status(400).json(new response_1.ApiResponse(false, 'Too many attempts', null, 400));
        }
        if (stored.otp !== otp) {
            await updateOTPAttempts(key, stored);
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid OTP', null, 400));
        }
        await deleteOTP(key);
        res.status(200).json(new response_1.ApiResponse(true, 'Email OTP verified successfully'));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to verify email OTP', null, 500));
    }
};
exports.verifyEmailOtp = verifyEmailOtp;
/** Resend email OTP */
const resendEmailOtp = async (req, res) => {
    try {
        const { error, value } = sendEmailOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { email } = value;
        const otp = generateOTP();
        const key = `otp:email:${email}`;
        await saveOTP(key, otp);
        const emailSent = await (0, email_1.sendOTPEmail)(email, otp);
        if (!emailSent) {
            await deleteOTP(key);
            return res.status(500).json(new response_1.ApiResponse(false, 'Failed to resend OTP', null, 500));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'OTP resent to email', {
            email,
            otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to resend email OTP', null, 500));
    }
};
exports.resendEmailOtp = resendEmailOtp;
/** Send mobile OTP */
const sendMobileOtp = async (req, res) => {
    try {
        const { error, value } = sendMobileOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { mobile } = value;
        const otp = generateOTP();
        const key = `otp:mobile:${mobile}`;
        await saveOTP(key, otp);
        const smsSent = await (0, email_1.sendOTPSMS)(mobile, otp);
        if (!smsSent) {
            await deleteOTP(key);
            return res.status(500).json(new response_1.ApiResponse(false, 'Failed to send SMS', null, 500));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'OTP sent to mobile', {
            mobile,
            otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to send mobile OTP', null, 500));
    }
};
exports.sendMobileOtp = sendMobileOtp;
/** Verify mobile OTP */
const verifyMobileOtp = async (req, res) => {
    try {
        const { error, value } = verifyMobileOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { mobile, otp } = value;
        const key = `otp:mobile:${mobile}`;
        const stored = await getOTP(key);
        if (!stored)
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP not found or expired', null, 400));
        if (stored.attempts >= 3) {
            await deleteOTP(key);
            return res.status(400).json(new response_1.ApiResponse(false, 'Too many attempts', null, 400));
        }
        if (stored.otp !== otp) {
            await updateOTPAttempts(key, stored);
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid OTP', null, 400));
        }
        await deleteOTP(key);
        res.status(200).json(new response_1.ApiResponse(true, 'Mobile OTP verified successfully'));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to verify mobile OTP', null, 500));
    }
};
exports.verifyMobileOtp = verifyMobileOtp;
/** Resend mobile OTP */
const resendMobileOtp = async (req, res) => {
    try {
        const { error, value } = sendMobileOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { mobile } = value;
        const otp = generateOTP();
        const key = `otp:mobile:${mobile}`;
        await saveOTP(key, otp);
        const smsSent = await (0, email_1.sendOTPSMS)(mobile, otp);
        if (!smsSent) {
            await deleteOTP(key);
            return res.status(500).json(new response_1.ApiResponse(false, 'Failed to resend SMS', null, 500));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'OTP resent to mobile', {
            mobile,
            otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to resend mobile OTP', null, 500));
    }
};
exports.resendMobileOtp = resendMobileOtp;
/** Send password reset OTP */
const sendPasswordResetOtp = async (req, res) => {
    try {
        const { error, value } = sendPasswordResetOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { email } = value;
        const user = await User_1.default.findOne({ email });
        if (!user)
            return res.status(404).json(new response_1.ApiResponse(false, 'No account found with this email', null, 404));
        const otp = generateOTP();
        const key = `otp:reset:${email}`;
        await saveOTP(key, otp);
        const emailSent = await (0, email_1.sendPasswordResetEmail)(email, otp, user.name);
        if (!emailSent) {
            await deleteOTP(key);
            return res.status(500).json(new response_1.ApiResponse(false, 'Failed to send OTP', null, 500));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Password reset OTP sent', {
            email,
            otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to send password reset OTP', null, 500));
    }
};
exports.sendPasswordResetOtp = sendPasswordResetOtp;
/** Verify password reset OTP */
const verifyPasswordResetOtp = async (req, res) => {
    try {
        const { error, value } = verifyPasswordResetOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { email, otp } = value;
        const key = `otp:reset:${email}`;
        const stored = await getOTP(key);
        if (!stored)
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP not found or expired', null, 400));
        if (stored.attempts >= 3) {
            await deleteOTP(key);
            return res.status(400).json(new response_1.ApiResponse(false, 'Too many attempts', null, 400));
        }
        if (stored.otp !== otp) {
            await updateOTPAttempts(key, stored);
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid OTP', null, 400));
        }
        // Do NOT delete the OTP key yet — resetPassword still needs it for cleanup.
        // Instead, set a short-lived "verified" flag (10 min TTL).
        const verifiedFlagKey = `reset_verified:${email}`;
        await redis_1.redisClient.set(verifiedFlagKey, '1', 'EX', 600); // 10 minutes
        res.status(200).json(new response_1.ApiResponse(true, 'OTP verified successfully'));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to verify OTP', null, 500));
    }
};
exports.verifyPasswordResetOtp = verifyPasswordResetOtp;
/** Reset password */
const resetPassword = async (req, res) => {
    try {
        const { error, value } = resetPasswordSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { email, newPassword } = value;
        const key = `otp:reset:${email}`;
        // Check verified flag set by verifyPasswordResetOtp — do NOT re-validate raw OTP (Bug 1 fix)
        const verifiedFlagKey = `reset_verified:${email}`;
        const isVerified = await redis_1.redisClient.get(verifiedFlagKey);
        if (!isVerified) {
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP not verified or session expired', null, 400));
        }
        const user = await User_1.default.findOne({ email });
        if (!user)
            return res.status(404).json(new response_1.ApiResponse(false, 'User not found', null, 404));
        user.password = await (0, password_1.hashPassword)(newPassword);
        await user.save();
        // Clean up both the original OTP key and the verified flag
        await deleteOTP(key);
        await redis_1.redisClient.del(verifiedFlagKey);
        // Revoke all refresh tokens for security
        await (0, authService_1.revokeAllTokens)(user._id.toString());
        logger_1.default.info(`Password reset successful for ${email}`);
        (0, email_1.sendPasswordChangedNotification)(user.email, user.name).catch((err) => logger_1.default.error(`Failed to send password changed alert to ${email}:`, err));
        res.status(200).json(new response_1.ApiResponse(true, 'Password reset successfully'));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to reset password', null, 500));
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=authController.js.map