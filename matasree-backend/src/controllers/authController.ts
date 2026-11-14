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
import { sendOTPEmail, sendOTPSMS, sendWelcomeEmail, sendPasswordResetEmail, sendPasswordChangedNotification } from '../utils/email';
import { issueTokens, rotateRefreshToken, revokeAllTokens, revokeToken, clearRefreshCookie } from '../services/authService';
import logger from '../config/logger';
import Joi from 'joi';
import { redisClient } from '../config/redis';
import { logSecurityEvent } from '../middleware/auditLogger';

// Redis helper functions for OAuth and OTP storage
const OTP_TTL_SECONDS = 300; // 5 minutes
const OAUTH_TOKEN_TTL_SECONDS = 300; // 5 minutes

async function saveOTP(key: string, otp: string) {
  const data = JSON.stringify({ otp, attempts: 0 });
  await redisClient.set(key, data, 'EX', OTP_TTL_SECONDS);
}

async function getOTP(key: string): Promise<{ otp: string; attempts: number } | null> {
  const data = await redisClient.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function updateOTPAttempts(key: string, stored: { otp: string; attempts: number }) {
  const data = JSON.stringify({ otp: stored.otp, attempts: stored.attempts + 1 });
  await redisClient.set(key, data, 'EX', OTP_TTL_SECONDS);
}

async function deleteOTP(key: string) {
  await redisClient.del(key);
}

async function saveOAuthToken(userId: string, accessToken: string, user: any) {
  const key = `oauth:${userId}`;
  const data = JSON.stringify({ accessToken, user });
  await redisClient.set(key, data, 'EX', OAUTH_TOKEN_TTL_SECONDS);
}

async function getAndConsumeOAuthToken(userId: string): Promise<{ accessToken: string; user: any } | null> {
  const key = `oauth:${userId}`;
  const data = await redisClient.get(key);
  if (!data) return null;
  await redisClient.del(key);
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

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

    // Issue tokens (access + refresh with HTTP-only cookie)
    const { accessToken } = await issueTokens(user, res, {
      ...(req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : {}),
      ...(req.ip ? { ipAddress: req.ip } : {}),
    });

    logger.info(`New user registered: ${email}`);

    // Send Welcome Email asynchronously
    sendWelcomeEmail(user.email, user.name).catch((err) =>
      logger.error(`Failed to send welcome email to ${email}:`, err)
    );

    res.status(201).json(
      new ApiResponse(true, 'Registration successful', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isAdmin: user.role === 'admin',
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

    // Check if account is locked out
    if (user.lockUntil && user.lockUntil > new Date()) {
      const lockTimeRemainingLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json(new ApiResponse(false, `Account is temporarily locked. Try again in ${lockTimeRemainingLeft} minute(s).`, null, 423));
    }

    // Check if user signed up via OAuth (no password set)
    if (user.provider !== 'local' && !user.password) {
      user.loginHistory.push({
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date(),
        success: false,
      });
      if (user.loginHistory.length > 20) user.loginHistory.shift();
      await user.save();

      return res.status(400).json(
        new ApiResponse(false, `This account uses ${user.provider} login. Please sign in with ${user.provider}.`, null, 400)
      );
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;
      user.loginHistory.push({
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date(),
        success: false,
      });
      if (user.loginHistory.length > 20) user.loginHistory.shift();

      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        await user.save();
        return res.status(423).json(new ApiResponse(false, 'Too many failed login attempts. Account locked for 15 minutes.', null, 423));
      }

      await user.save();
      const remainingAttemptsLeft = 5 - user.failedLoginAttempts;
      return res.status(401).json(new ApiResponse(false, `Invalid email or password. ${remainingAttemptsLeft} attempt(s) remaining before lockout.`, null, 401));
    }

    // Check for suspicious login: successful logins exist, but none from this specific IP & user agent combination
    const hasPriorSuccessfulLogins = user.loginHistory.some(history => history.success);
    const isKnownDeviceOrIp = !hasPriorSuccessfulLogins || user.loginHistory.some(
      history => history.success && 
      history.ip === (req.ip || 'unknown') && 
      history.userAgent === (req.headers['user-agent'] || 'unknown')
    );

    if (!isKnownDeviceOrIp) {
      await logSecurityEvent(
        user._id.toString(),
        'SUSPICIOUS_LOGIN_DETECTED',
        'User',
        user._id.toString(),
        {
          ip: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          message: 'Login from a new IP or device combination'
        },
        req
      );
      logger.warn(`⚠️ Suspicious login detected for user ${user.email} from IP: ${req.ip || 'unknown'}`);
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
    if (user.loginHistory.length > 20) user.loginHistory.shift();
    await user.save();

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
          isAdmin: user.role === 'admin',
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
    // Authenticate via the httpOnly refresh-token cookie (no Bearer token available yet)
    const refreshTokenCookie = (req as any).cookies?.refreshToken;
    if (!refreshTokenCookie) {
      return res.status(401).json(new ApiResponse(false, 'No session found. Please log in again.', null, 401));
    }

    // Verify the refresh token to get the userId
    const { verifyRefreshToken } = await import('../utils/jwt');
    let decoded: any;
    try {
      decoded = verifyRefreshToken(refreshTokenCookie);
    } catch {
      return res.status(401).json(new ApiResponse(false, 'Invalid session. Please log in again.', null, 401));
    }

    const userId = decoded.userId?.toString();
    if (!userId) {
      return res.status(401).json(new ApiResponse(false, 'Unauthorized', null, 401));
    }

    const tokenData = await getAndConsumeOAuthToken(userId);

    // Token not found or expired
    if (!tokenData) {
      return res.status(401).json(new ApiResponse(false, 'No token available or expired. Please log in again.', null, 401));
    }

    const { accessToken, user } = tokenData;

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
        isAdmin: user.role === 'admin',
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

/// ============================================================
// OTP SYSTEM (Kept from original - using Redis client wrapper)
// ============================================================

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Send email OTP */
export const sendEmailOtp = async (req: any, res: Response) => {
  try {
    const { error, value } = sendEmailOtpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }
    const { email } = value;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json(new ApiResponse(false, 'Email already registered', null, 400));

    const otp = generateOTP();
    const key = `otp:email:${email}`;
    await saveOTP(key, otp);

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      await deleteOTP(key);
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
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }
    const { email, otp } = value;
    const key = `otp:email:${email}`;

    const stored = await getOTP(key);
    if (!stored) return res.status(400).json(new ApiResponse(false, 'OTP not found or expired', null, 400));
    if (stored.attempts >= 3) {
      await deleteOTP(key);
      return res.status(400).json(new ApiResponse(false, 'Too many attempts', null, 400));
    }
    if (stored.otp !== otp) {
      await updateOTPAttempts(key, stored);
      return res.status(400).json(new ApiResponse(false, 'Invalid OTP', null, 400));
    }

    await deleteOTP(key);
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
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }
    const { email } = value;

    const otp = generateOTP();
    const key = `otp:email:${email}`;
    await saveOTP(key, otp);

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      await deleteOTP(key);
      return res.status(500).json(new ApiResponse(false, 'Failed to resend OTP', null, 500));
    }

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
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }
    const { mobile } = value;

    const otp = generateOTP();
    const key = `otp:mobile:${mobile}`;
    await saveOTP(key, otp);

    const smsSent = await sendOTPSMS(mobile, otp);
    if (!smsSent) {
      await deleteOTP(key);
      return res.status(500).json(new ApiResponse(false, 'Failed to send SMS', null, 500));
    }

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
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }
    const { mobile, otp } = value;
    const key = `otp:mobile:${mobile}`;

    const stored = await getOTP(key);
    if (!stored) return res.status(400).json(new ApiResponse(false, 'OTP not found or expired', null, 400));
    if (stored.attempts >= 3) {
      await deleteOTP(key);
      return res.status(400).json(new ApiResponse(false, 'Too many attempts', null, 400));
    }
    if (stored.otp !== otp) {
      await updateOTPAttempts(key, stored);
      return res.status(400).json(new ApiResponse(false, 'Invalid OTP', null, 400));
    }

    await deleteOTP(key);
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
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }
    const { mobile } = value;

    const otp = generateOTP();
    const key = `otp:mobile:${mobile}`;
    await saveOTP(key, otp);

    const smsSent = await sendOTPSMS(mobile, otp);
    if (!smsSent) {
      await deleteOTP(key);
      return res.status(500).json(new ApiResponse(false, 'Failed to resend SMS', null, 500));
    }

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
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }
    const { email } = value;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json(new ApiResponse(false, 'No account found with this email', null, 404));

    const otp = generateOTP();
    const key = `otp:reset:${email}`;
    await saveOTP(key, otp);

    const emailSent = await sendPasswordResetEmail(email, otp, user.name);
    if (!emailSent) {
      await deleteOTP(key);
      return res.status(500).json(new ApiResponse(false, 'Failed to send OTP', null, 500));
    }

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
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }
    const { email, otp } = value;
    const key = `otp:reset:${email}`;

    const stored = await getOTP(key);
    if (!stored) return res.status(400).json(new ApiResponse(false, 'OTP not found or expired', null, 400));
    if (stored.attempts >= 3) {
      await deleteOTP(key);
      return res.status(400).json(new ApiResponse(false, 'Too many attempts', null, 400));
    }
    if (stored.otp !== otp) {
      await updateOTPAttempts(key, stored);
      return res.status(400).json(new ApiResponse(false, 'Invalid OTP', null, 400));
    }

    // Do NOT delete the OTP key yet — resetPassword still needs it for cleanup.
    // Instead, set a short-lived "verified" flag (10 min TTL).
    const verifiedFlagKey = `reset_verified:${email}`;
    await redisClient.set(verifiedFlagKey, '1', 'EX', 600); // 10 minutes
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
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }
    const { email, newPassword } = value;
    const key = `otp:reset:${email}`;

    // Check verified flag set by verifyPasswordResetOtp — do NOT re-validate raw OTP (Bug 1 fix)
    const verifiedFlagKey = `reset_verified:${email}`;
    const isVerified = await redisClient.get(verifiedFlagKey);
    if (!isVerified) {
      return res.status(400).json(new ApiResponse(false, 'OTP not verified or session expired', null, 400));
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json(new ApiResponse(false, 'User not found', null, 404));

    user.password = await hashPassword(newPassword);
    await user.save();
    // Clean up both the original OTP key and the verified flag
    await deleteOTP(key);
    await redisClient.del(verifiedFlagKey);

    // Revoke all refresh tokens for security
    await revokeAllTokens(user._id.toString());

    logger.info(`Password reset successful for ${email}`);
    sendPasswordChangedNotification(user.email, user.name).catch((err) =>
      logger.error(`Failed to send password changed alert to ${email}:`, err)
    );
    res.status(200).json(new ApiResponse(true, 'Password reset successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to reset password', null, 500));
  }
};
