"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyPasswordResetOtp = exports.sendPasswordResetOtp = exports.resendMobileOtp = exports.verifyMobileOtp = exports.sendMobileOtp = exports.resendEmailOtp = exports.verifyEmailOtp = exports.sendEmailOtp = exports.updateProfile = exports.getProfile = exports.logoutAll = exports.logout = exports.oauthCallback = exports.refreshToken = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const password_1 = require("../utils/password");
const response_1 = require("../utils/response");
const email_1 = require("../utils/email");
const authService_1 = require("../services/authService");
const logger_1 = __importDefault(require("../config/logger"));
const joi_1 = __importDefault(require("joi"));
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
// ============================================================
// LOCAL AUTH (Email + Password)
// ============================================================
/**
 * Register a new user with email/password
 */
const register = async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
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
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
        });
        logger_1.default.info(`New user registered: ${email}`);
        res.status(201).json(new response_1.ApiResponse(true, 'Registration successful', {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                isAdmin: user.isAdmin || false,
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
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { email, password } = value;
        // Find user with password field
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json(new response_1.ApiResponse(false, 'Invalid email or password', null, 401));
        }
        // Check if user signed up via OAuth (no password set)
        if (user.provider !== 'local' && !user.password) {
            return res.status(400).json(new response_1.ApiResponse(false, `This account uses ${user.provider} login. Please sign in with ${user.provider}.`, null, 400));
        }
        // Compare password
        const isPasswordValid = await (0, password_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json(new response_1.ApiResponse(false, 'Invalid email or password', null, 401));
        }
        // Issue tokens
        const { accessToken } = await (0, authService_1.issueTokens)(user, res, {
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
        });
        logger_1.default.info(`User logged in: ${email}`);
        res.status(200).json(new response_1.ApiResponse(true, 'Login successful', {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                isAdmin: user.isAdmin || false,
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
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
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
 * Issues tokens and redirects to frontend with access token
 */
const oauthCallback = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8000'}/login?error=auth_failed`);
        }
        // Issue tokens
        const { accessToken } = await (0, authService_1.issueTokens)(user, res, {
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
        });
        // Redirect to frontend with access token in URL (frontend will extract and store it)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
        const redirectUrl = `${frontendUrl}/auth/callback?token=${accessToken}&user=${encodeURIComponent(JSON.stringify({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            isAdmin: user.isAdmin || false,
        }))}`;
        logger_1.default.info(`OAuth login successful: ${user.email} (${user.provider})`);
        res.redirect(redirectUrl);
    }
    catch (error) {
        logger_1.default.error('OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8000'}/login?error=auth_failed`);
    }
};
exports.oauthCallback = oauthCallback;
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
        const { name, phone } = req.body;
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
// ============================================================
// OTP SYSTEM (Kept from original - unchanged logic)
// ============================================================
// OTP Storage (In production, use Redis)
const otpStore = {};
const emailOtpStore = {};
const passwordResetOtpStore = {};
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/** Send email OTP */
const sendEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json(new response_1.ApiResponse(false, 'Email is required', null, 400));
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser)
            return res.status(400).json(new response_1.ApiResponse(false, 'Email already registered', null, 400));
        const otp = generateOTP();
        emailOtpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 };
        const emailSent = await (0, email_1.sendOTPEmail)(email, otp);
        if (!emailSent) {
            delete emailOtpStore[email];
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
        const { email, otp } = req.body;
        if (!email || !otp)
            return res.status(400).json(new response_1.ApiResponse(false, 'Email and OTP are required', null, 400));
        const stored = emailOtpStore[email];
        if (!stored)
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP not found or expired', null, 400));
        if (stored.expiresAt < Date.now()) {
            delete emailOtpStore[email];
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP has expired', null, 400));
        }
        if (stored.attempts >= 3) {
            delete emailOtpStore[email];
            return res.status(400).json(new response_1.ApiResponse(false, 'Too many attempts', null, 400));
        }
        if (stored.otp !== otp) {
            stored.attempts++;
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid OTP', null, 400));
        }
        delete emailOtpStore[email];
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
        const { email } = req.body;
        if (!email)
            return res.status(400).json(new response_1.ApiResponse(false, 'Email is required', null, 400));
        const otp = generateOTP();
        emailOtpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 };
        const emailSent = await (0, email_1.sendOTPEmail)(email, otp);
        if (!emailSent) {
            delete emailOtpStore[email];
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
        const { mobile } = req.body;
        if (!mobile)
            return res.status(400).json(new response_1.ApiResponse(false, 'Mobile number is required', null, 400));
        const otp = generateOTP();
        otpStore[mobile] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 };
        const smsSent = await (0, email_1.sendOTPSMS)(mobile, otp);
        if (!smsSent) {
            delete otpStore[mobile];
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
        const { mobile, otp } = req.body;
        if (!mobile || !otp)
            return res.status(400).json(new response_1.ApiResponse(false, 'Mobile number and OTP are required', null, 400));
        const stored = otpStore[mobile];
        if (!stored)
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP not found or expired', null, 400));
        if (stored.expiresAt < Date.now()) {
            delete otpStore[mobile];
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP has expired', null, 400));
        }
        if (stored.attempts >= 3) {
            delete otpStore[mobile];
            return res.status(400).json(new response_1.ApiResponse(false, 'Too many attempts', null, 400));
        }
        if (stored.otp !== otp) {
            stored.attempts++;
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid OTP', null, 400));
        }
        delete otpStore[mobile];
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
        const { mobile } = req.body;
        if (!mobile)
            return res.status(400).json(new response_1.ApiResponse(false, 'Mobile number is required', null, 400));
        const otp = generateOTP();
        otpStore[mobile] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 };
        const smsSent = await (0, email_1.sendOTPSMS)(mobile, otp);
        if (!smsSent) {
            delete otpStore[mobile];
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
        const { email } = req.body;
        if (!email)
            return res.status(400).json(new response_1.ApiResponse(false, 'Email is required', null, 400));
        const user = await User_1.default.findOne({ email });
        if (!user)
            return res.status(404).json(new response_1.ApiResponse(false, 'No account found with this email', null, 404));
        const otp = generateOTP();
        passwordResetOtpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 };
        const emailSent = await (0, email_1.sendOTPEmail)(email, otp);
        if (!emailSent) {
            delete passwordResetOtpStore[email];
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
        const { email, otp } = req.body;
        if (!email || !otp)
            return res.status(400).json(new response_1.ApiResponse(false, 'Email and OTP are required', null, 400));
        const stored = passwordResetOtpStore[email];
        if (!stored)
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP not found or expired', null, 400));
        if (stored.expiresAt < Date.now()) {
            delete passwordResetOtpStore[email];
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP has expired', null, 400));
        }
        if (stored.attempts >= 3) {
            delete passwordResetOtpStore[email];
            return res.status(400).json(new response_1.ApiResponse(false, 'Too many attempts', null, 400));
        }
        if (stored.otp !== otp) {
            stored.attempts++;
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid OTP', null, 400));
        }
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
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword)
            return res.status(400).json(new response_1.ApiResponse(false, 'Email, OTP, and new password are required', null, 400));
        const stored = passwordResetOtpStore[email];
        if (!stored)
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP not found or expired', null, 400));
        if (stored.expiresAt < Date.now()) {
            delete passwordResetOtpStore[email];
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP has expired', null, 400));
        }
        if (stored.otp !== otp)
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid OTP', null, 400));
        const user = await User_1.default.findOne({ email });
        if (!user)
            return res.status(404).json(new response_1.ApiResponse(false, 'User not found', null, 404));
        user.password = await (0, password_1.hashPassword)(newPassword);
        await user.save();
        delete passwordResetOtpStore[email];
        // Revoke all refresh tokens for security
        await (0, authService_1.revokeAllTokens)(user._id.toString());
        logger_1.default.info(`Password reset successful for ${email}`);
        res.status(200).json(new response_1.ApiResponse(true, 'Password reset successfully'));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to reset password', null, 500));
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=authController.js.map