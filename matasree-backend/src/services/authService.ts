/**
 * Auth Service
 * Handles token generation, refresh token management, and OAuth token issuance
 * Separates business logic from controller layer
 */
import { Response } from 'express';
import RefreshToken from '../models/RefreshToken';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import logger from '../config/logger';

// Cookie options for refresh token
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,                                          // Prevent XSS access
  secure: process.env.NODE_ENV === 'production',           // HTTPS only in production
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,                        // 7 days
  path: '/',
};

/**
 * Issue new access + refresh tokens for a user
 * Stores refresh token in DB and sets HTTP-only cookie
 */
export const issueTokens = async (
  user: { _id: any; email: string; role: string },
  res: Response,
  meta?: { userAgent?: string; ipAddress?: string }
) => {
  const userId = user._id.toString();

  // Generate tokens
  const accessToken = generateAccessToken(userId, user.email, user.role);
  const refreshToken = generateRefreshToken(userId);

  // Calculate expiry (7 days from now)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Store refresh token in database
  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt,
    userAgent: meta?.userAgent,
    ipAddress: meta?.ipAddress,
  });

  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  logger.info(`Tokens issued for user: ${user.email}`);

  return { accessToken, refreshToken };
};

/**
 * Rotate refresh token - issue new pair, revoke old
 * Implements refresh token rotation for security
 */
export const rotateRefreshToken = async (
  oldRefreshToken: string,
  res: Response,
  meta?: { userAgent?: string; ipAddress?: string }
) => {
  // Verify the old refresh token
  const decoded = verifyRefreshToken(oldRefreshToken);
  const userId = decoded.userId;

  // Find the stored token
  const storedToken = await RefreshToken.findOne({
    token: oldRefreshToken,
    isRevoked: false,
  });

  if (!storedToken) {
    // Token reuse detected - potential theft!
    // Revoke ALL tokens for this user as a safety measure
    await RefreshToken.updateMany(
      { userId },
      { isRevoked: true }
    );
    logger.warn(`⚠️  Refresh token reuse detected for user: ${userId}. All tokens revoked.`);
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
  const User = (await import('../models/User')).default;
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const accessToken = generateAccessToken(userId, user.email, user.role);
  const newRefreshToken = generateRefreshToken(userId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Store new refresh token
  await RefreshToken.create({
    userId,
    token: newRefreshToken,
    expiresAt,
    userAgent: meta?.userAgent,
    ipAddress: meta?.ipAddress,
  });

  // Set new cookie
  res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

  logger.info(`Refresh token rotated for user: ${user.email}`);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
    },
  };
};

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export const revokeAllTokens = async (userId: string) => {
  const result = await RefreshToken.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true }
  );
  logger.info(`Revoked ${result.modifiedCount} refresh tokens for user: ${userId}`);
};

/**
 * Revoke specific refresh token (single session logout)
 */
export const revokeToken = async (token: string) => {
  await RefreshToken.findOneAndUpdate(
    { token },
    { isRevoked: true }
  );
};

/**
 * Clear refresh token cookie
 */
export const clearRefreshCookie = (res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
  });
};
