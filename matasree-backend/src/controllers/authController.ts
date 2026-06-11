/**
 * Auth Controller - Production Ready
 * Handles local auth (email/password), OAuth callbacks, token refresh, and logout
 * Uses AuthService for token management and HTTP-only cookies
 */
import { Response, RequestHandler } from 'express';
import User from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { ApiResponse, ApiError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendOTPEmail, sendOTPSMS } from '../utils/email';
import { issueTokens, rotateRefreshToken, revokeAllTokens, revokeToken, clearRefreshCookie } from '../services/authService';
import { generateReferralCode } from '../services/referralService';
import logger from '../config/logger';
import Joi from 'joi';

// ============================================================
// OAUTH TOKEN STORAGE (for secure one-time token retrieval)
// ============================================================
// Temporary storage: { userId: { accessToken, expiresAt, user } }
// Token is consumed exactly once and cleaned up after 5 minutes
const oauthTokenStore: Record<string, { accessToken: string; expiresAt: number; user: any }> = {};

// Cleanup expired tokens every minute
setInterval(() => {
  const now = Date.now();
  Object.entries(oauthTokenStore).forEach(([userId, data]) => {
    if (data.expiresAt < now) {
      delete oauthTokenStore[userId];
      logger.debug(`Cleaned up expired OAuth token for user ${userId}`);
    }
  });
}, 60000);

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const registerSchema = Joi.object({
  name: Joi.string().required().trim().min(2).max(100),
  email: Joi.string().email().required().lowercase(),
  password: Joi.string().min(6).max(128).required(),
  phone: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  phone: Joi.string().trim().optional(),
});

const sendEmailOtpSchema = Joi.object({
  email: Joi.string().email().required().lowercase(),
});

const verifyEmailOtpSchema = Joi.object({
  email: Joi.string().email().required().lowercase(),
  otp: Joi.string().length(6).required(),
});

const sendMobileOtpSchema = Joi.object({
  mobile: Joi.string().required().trim(),
});

const verifyMobileOtpSchema = Joi.object({
  mobile: Joi.string().required().trim(),
  otp: Joi.string().length(6).required(),
});

const sendPasswordResetOtpSchema = Joi.object({
  email: Joi.string().email().required().lowercase(),
});

const verifyPasswordResetOtpSchema = Joi.object({
  email: Joi.string().email().required().lowercase(),
  otp: Joi.string().length(6).required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().lowercase(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).max(128).required(),
});

// ============================================================
// LOCAL AUTH (Email + Password)
// ============================================================

/**
 * Register a new user with email/password
 */
export const register = async (req: any, res: Response) => {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { name, email, password, phone } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(new ApiResponse(false, 'Email already registered', null, 400));
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'customer',
      provider: 'local',
    });

    // Generate and assign a unique referral code for the new user (Req 11.1)
    try {
      await generateReferralCode(user._id);
    } catch (referralErr: any) {
      // Non-fatal — log and continue; registration should not fail because of this
      logger.warn(`[register] Could not generate referral code for user ${user._id.toString()}: ${referralErr.message}`);
    }

    // Issue tokens (access + refresh with HTTP-only cookie)
    const { accessToken } = await issueTokens(user, res, {
      ...(req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : {}),
      ...(req.ip ? { ipAddress: req.ip } : {}),
    });

    logger.info(`New user registered: ${email}`);

    res.status(201).json(
      new ApiResponse(true, 'Registration successful', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        accessToken,
      })
    );
  } catch (error: any) {
    logger.error('Registration error:', error);
    res.status(500).json(new ApiResponse(false, error.message || 'Registration failed', null, 500));
  }
};

/**
 * Login user with email/password
 */
export const login = async (req: any, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { email, password } = value;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json(new ApiResponse(false, 'Invalid email or password', null, 401));
    }

    // Check if user signed up via OAuth (no password set)
    if (user.provider !== 'local' && !user.password) {
      return res.status(400).json(
        new ApiResponse(false, `This account uses ${user.provider} login. Please sign in with ${user.provider}.`, null, 400)
      );
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(new ApiResponse(false, 'Invalid email or password', null, 401));
    }

    // Issue tokens
    const { accessToken } = await issueTokens(user, res, {
      ...(req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : {}),
      ...(req.ip ? { ipAddress: req.ip } : {}),
    });

    logger.info(`User logged in: ${email}`);

    res.status(200).json(
      new ApiResponse(true, 'Login successful', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        accessToken,
      })
    );
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(500).json(new ApiResponse(false, error.message || 'Login failed', null, 500));
  }
};

// ============================================================
// TOKEN REFRESH
// ============================================================

/**
 * Refresh access token using refresh token from HTTP-only cookie
 * Implements token rotation for security
 */
export const refreshToken = async (req: any, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json(new ApiResponse(false, 'No refresh token provided', null, 401));
    }

    const result = await rotateRefreshToken(token, res, {
      ...(req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : {}),
      ...(req.ip ? { ipAddress: req.ip } : {}),
    });

    res.status(200).json(
      new ApiResponse(true, 'Token refreshed', {
        user: result.user,
        accessToken: result.accessToken,
      })
    );
  } catch (error: any) {
    clearRefreshCookie(res);
    logger.error('Token refresh error:', error.message);
    res.status(401).json(new ApiResponse(false, error.message || 'Token refresh failed', null, 401));
  }
};

// ============================================================
// OAUTH CALLBACK HANDLER
// ============================================================

/**
 * Handle OAuth callback (used for both Google and GitHub)
 * Stores token in memory and redirects to frontend without token in URL
 * Frontend fetches token from GET /api/auth/token endpoint
 */
export const oauthCallback: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8000'}/login?error=auth_failed`);
    }

    // Issue tokens (refresh token set as httpOnly cookie by issueTokens)
    const { accessToken } = await issueTokens(user, res, {
      ...(req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] as string } : {}),
      ...(req.ip ? { ipAddress: req.ip } : {}),
    });

    // Store token in memory for one-time retrieval by frontend (expires in 5 minutes)
    oauthTokenStore[user._id.toString()] = {
      accessToken,
      expiresAt: Date.now() + 5 * 60 * 1000,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };

    // Redirect to frontend WITHOUT token in URL (secure against URL history leaks)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
    const redirectUrl = `${frontendUrl}/auth/callback`;

    logger.info(`OAuth login successful: ${user.email} (${user.provider}), token stored for retrieval`);
    res.redirect(redirectUrl);
  } catch (error: any) {
    logger.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8000'}/login?error=auth_failed`);
  }
};

// ============================================================
// OAUTH TOKEN RETRIEVAL (secure, one-time, cookie-authenticated)
// ============================================================

/**
 * Get OAuth access token (called by frontend after OAuth redirect)
 * Returns token exactly once, then destroys it
 * Requires valid httpOnly refresh cookie from OAuth flow
 */
export const getOAuthToken: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      return res.status(401).json(new ApiResponse(false, 'Unauthorized', null, 401));
    }

    const userIdStr = userId.toString();
    const tokenData = oauthTokenStore[userIdStr];

    // Token not found or expired
    if (!tokenData) {
      return res.status(401).json(new ApiResponse(false, 'No token available. Please log in again.', null, 401));
    }

    // Token expired
    if (tokenData.expiresAt < Date.now()) {
      delete oauthTokenStore[userIdStr];
      return res.status(401).json(new ApiResponse(false, 'Token expired. Please log in again.', null, 401));
    }

    // Consume token exactly once
    const { accessToken, user } = tokenData;
    delete oauthTokenStore[userIdStr];

    logger.info(`OAuth token retrieved and consumed for user ${userId}`);

    res.status(200).json(
      new ApiResponse(true, 'OAuth token retrieved', {
        accessToken,
        user,
      })
    );
  } catch (error: any) {
    logger.error('Get OAuth token error:', error);
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to retrieve OAuth token', null, 500));
  }
};

// ============================================================
// LOGOUT
// ============================================================

/**
 * Logout user - revoke refresh token and clear cookie
 */
export const logout: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const refreshTokenFromCookie = (req as any).cookies?.refreshToken || authReq.cookies?.refreshToken;

    // Revoke the specific refresh token
    if (refreshTokenFromCookie) {
      await revokeToken(refreshTokenFromCookie);
    }

    // Clear the cookie
    clearRefreshCookie(res);

    logger.info(`User logged out: ${authReq.user?.userId}`);
    res.status(200).json(new ApiResponse(true, 'Logout successful'));
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(500).json(new ApiResponse(false, error.message || 'Logout failed', null, 500));
  }
};

/**
 * Logout from all devices - revoke ALL refresh tokens
 */
export const logoutAll: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.userId) {
      await revokeAllTokens(authReq.user.userId);
    }

    clearRefreshCookie(res);

    logger.info(`User logged out from all devices: ${authReq.user?.userId}`);
    res.status(200).json(new ApiResponse(true, 'Logged out from all devices'));
  } catch (error: any) {
    logger.error('Logout all error:', error);
    res.status(500).json(new ApiResponse(false, error.message || 'Logout failed', null, 500));
  }
};

// ============================================================
// PROFILE
// ============================================================

/**
 * Get current user profile
 */
export const getProfile: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = await User.findById(authReq.user?.userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(false, 'User not found', null, 404));
    }

    res.status(200).json(
      new ApiResponse(true, 'Profile fetched', {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        provider: user.provider,
        isEmailVerified: user.isEmailVerified,
      })
    );
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch profile', null, 500));
  }
};

/**
 * Update user profile
 */
export const updateProfile: RequestHandler = async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }
    const { name, phone } = value;
    const authReq = req as AuthenticatedRequest;
    const user = await User.findByIdAndUpdate(
      authReq.user?.userId,
      { name, phone },
      { new: true }
    );

    if (!user) {
      return res.status(404).json(new ApiResponse(false, 'User not found', null, 404));
    }

    res.status(200).json(
      new ApiResponse(true, 'Profile updated', {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
      })
    );
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to update profile', null, 500));
  }
};

// ============================================================
// OTP SYSTEM (Kept from original - unchanged logic)
// ============================================================

// OTP Storage (In production, use Redis)
const otpStore: Record<string, { otp: string; expiresAt: number; attempts: number }> = {};
const emailOtpStore: Record<string, { otp: string; expiresAt: number; attempts: number }> = {};
const passwordResetOtpStore: Record<string, { otp: string; expiresAt: number; attempts: number }> = {};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Send email OTP */
export const sendEmailOtp = async (req: any, res: Response) => {
  try {
    const { error, value } = sendEmailOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { email } = value;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json(new ApiResponse(false, 'Email already registered', null, 400));

    const otp = generateOTP();
    emailOtpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 };

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      delete emailOtpStore[email];
      return res.status(500).json(new ApiResponse(false, 'Failed to send OTP email', null, 500));
    }

    res.status(200).json(new ApiResponse(true, 'OTP sent to email', {
      email,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    }));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to send email OTP', null, 500));
  }
};

/** Verify email OTP */
export const verifyEmailOtp = async (req: any, res: Response) => {
  try {
    const { error, value } = verifyEmailOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { email, otp } = value;

    const stored = emailOtpStore[email];
    if (!stored) return res.status(400).json(new ApiResponse(false, 'OTP not found or expired', null, 400));
    if (stored.expiresAt < Date.now()) { delete emailOtpStore[email]; return res.status(400).json(new ApiResponse(false, 'OTP has expired', null, 400)); }
    if (stored.attempts >= 3) { delete emailOtpStore[email]; return res.status(400).json(new ApiResponse(false, 'Too many attempts', null, 400)); }
    if (stored.otp !== otp) { stored.attempts++; return res.status(400).json(new ApiResponse(false, 'Invalid OTP', null, 400)); }

    delete emailOtpStore[email];
    res.status(200).json(new ApiResponse(true, 'Email OTP verified successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to verify email OTP', null, 500));
  }
};

/** Resend email OTP */
export const resendEmailOtp = async (req: any, res: Response) => {
  try {
    const { error, value } = sendEmailOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { email } = value;

    const otp = generateOTP();
    emailOtpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 };

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) { delete emailOtpStore[email]; return res.status(500).json(new ApiResponse(false, 'Failed to resend OTP', null, 500)); }

    res.status(200).json(new ApiResponse(true, 'OTP resent to email', {
      email,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    }));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to resend email OTP', null, 500));
  }
};

/** Send mobile OTP */
export const sendMobileOtp = async (req: any, res: Response) => {
  try {
    const { error, value } = sendMobileOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { mobile } = value;

    const otp = generateOTP();
    otpStore[mobile] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 };

    const smsSent = await sendOTPSMS(mobile, otp);
    if (!smsSent) { delete otpStore[mobile]; return res.status(500).json(new ApiResponse(false, 'Failed to send SMS', null, 500)); }

    res.status(200).json(new ApiResponse(true, 'OTP sent to mobile', {
      mobile,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    }));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to send mobile OTP', null, 500));
  }
};

/** Verify mobile OTP */
export const verifyMobileOtp = async (req: any, res: Response) => {
  try {
    const { error, value } = verifyMobileOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { mobile, otp } = value;

    const stored = otpStore[mobile];
    if (!stored) return res.status(400).json(new ApiResponse(false, 'OTP not found or expired', null, 400));
    if (stored.expiresAt < Date.now()) { delete otpStore[mobile]; return res.status(400).json(new ApiResponse(false, 'OTP has expired', null, 400)); }
    if (stored.attempts >= 3) { delete otpStore[mobile]; return res.status(400).json(new ApiResponse(false, 'Too many attempts', null, 400)); }
    if (stored.otp !== otp) { stored.attempts++; return res.status(400).json(new ApiResponse(false, 'Invalid OTP', null, 400)); }

    delete otpStore[mobile];
    res.status(200).json(new ApiResponse(true, 'Mobile OTP verified successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to verify mobile OTP', null, 500));
  }
};

/** Resend mobile OTP */
export const resendMobileOtp = async (req: any, res: Response) => {
  try {
    const { error, value } = sendMobileOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { mobile } = value;

    const otp = generateOTP();
    otpStore[mobile] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 };

    const smsSent = await sendOTPSMS(mobile, otp);
    if (!smsSent) { delete otpStore[mobile]; return res.status(500).json(new ApiResponse(false, 'Failed to resend SMS', null, 500)); }

    res.status(200).json(new ApiResponse(true, 'OTP resent to mobile', {
      mobile,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    }));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to resend mobile OTP', null, 500));
  }
};

/** Send password reset OTP */
export const sendPasswordResetOtp = async (req: any, res: Response) => {
  try {
    const { error, value } = sendPasswordResetOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { email } = value;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json(new ApiResponse(false, 'No account found with this email', null, 404));

    const otp = generateOTP();
    passwordResetOtpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 };

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) { delete passwordResetOtpStore[email]; return res.status(500).json(new ApiResponse(false, 'Failed to send OTP', null, 500)); }

    res.status(200).json(new ApiResponse(true, 'Password reset OTP sent', {
      email,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    }));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to send password reset OTP', null, 500));
  }
};

/** Verify password reset OTP */
export const verifyPasswordResetOtp = async (req: any, res: Response) => {
  try {
    const { error, value } = verifyPasswordResetOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { email, otp } = value;

    const stored = passwordResetOtpStore[email];
    if (!stored) return res.status(400).json(new ApiResponse(false, 'OTP not found or expired', null, 400));
    if (stored.expiresAt < Date.now()) { delete passwordResetOtpStore[email]; return res.status(400).json(new ApiResponse(false, 'OTP has expired', null, 400)); }
    if (stored.attempts >= 3) { delete passwordResetOtpStore[email]; return res.status(400).json(new ApiResponse(false, 'Too many attempts', null, 400)); }
    if (stored.otp !== otp) { stored.attempts++; return res.status(400).json(new ApiResponse(false, 'Invalid OTP', null, 400)); }

    res.status(200).json(new ApiResponse(true, 'OTP verified successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to verify OTP', null, 500));
  }
};

/** Reset password */
export const resetPassword = async (req: any, res: Response) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { email, otp, newPassword } = value;

    const stored = passwordResetOtpStore[email];
    if (!stored) return res.status(400).json(new ApiResponse(false, 'OTP not found or expired', null, 400));
    if (stored.expiresAt < Date.now()) { delete passwordResetOtpStore[email]; return res.status(400).json(new ApiResponse(false, 'OTP has expired', null, 400)); }
    if (stored.otp !== otp) return res.status(400).json(new ApiResponse(false, 'Invalid OTP', null, 400));

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json(new ApiResponse(false, 'User not found', null, 404));

    user.password = await hashPassword(newPassword);
    await user.save();
    delete passwordResetOtpStore[email];

    // Revoke all refresh tokens for security
    await revokeAllTokens(user._id.toString());

    logger.info(`Password reset successful for ${email}`);
    res.status(200).json(new ApiResponse(true, 'Password reset successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to reset password', null, 500));
  }
};
