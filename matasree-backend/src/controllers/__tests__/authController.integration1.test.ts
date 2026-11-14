/**
 * Integration Test — Bug 1 Fix: Password Reset End-to-End Flow
 *
 * End-to-end flow:
 *   POST /api/auth/forgot-password
 *   → seed OTP in Redis (intercepting what would be sent via email)
 *   → POST /api/auth/verify-reset-otp
 *   → POST /api/auth/reset-password
 *   → POST /api/auth/login with new password   (must succeed — HTTP 200)
 *   → POST /api/auth/login with old password   (must fail   — HTTP 401)
 *
 * Uses supertest against a minimal Express app (auth routes only) so we avoid
 * bootstrapping the full server with passport, DB connections, etc.
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// ── Mocks (before any imports that trigger the real modules) ─────────────────

// In-memory Redis mock
jest.mock('../../config/redis', () => {
  const store = new Map<string, string>();

  const redisClient = {
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    set: jest.fn(async (key: string, value: string, _mode?: string, _ttl?: number) => {
      store.set(key, value);
      return 'OK';
    }),
    del: jest.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
    keys: jest.fn(async () => []),
    isUsingFallback: jest.fn(() => true),
    _store: store,
  };

  return { redisClient };
});

// Mock MongoDB User model
jest.mock('../../models/User');

// Mock email sending
jest.mock('../../utils/email', () => ({
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendOTPSMS: jest.fn().mockResolvedValue(true),
}));

// Mock authService token management
jest.mock('../../services/authService', () => ({
  issueTokens: jest.fn().mockImplementation(async (user: any, _res: any) => {
    return { accessToken: `access_token_for_${user.email}` };
  }),
  rotateRefreshToken: jest.fn(),
  revokeAllTokens: jest.fn().mockResolvedValue(undefined),
  revokeToken: jest.fn(),
  clearRefreshCookie: jest.fn(),
}));

// Mock audit logger
jest.mock('../../middleware/auditLogger', () => ({
  logSecurityEvent: jest.fn().mockResolvedValue(undefined),
  auditLogAction: jest.fn(() => (_req: any, _res: any, next: any) => next()),
}));

// Mock password utilities with simple predictable behavior
jest.mock('../../utils/password', () => ({
  hashPassword: jest.fn(async (pw: string) => `hashed::${pw}`),
  comparePassword: jest.fn(async (plain: string, hashed: string) => hashed === `hashed::${plain}`),
}));

// ── Build minimal Express app for auth routes ────────────────────────────────

// Import after mocks are established
import { redisClient } from '../../config/redis';
import User from '../../models/User';
import {
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
  login,
} from '../authController';
import { issueTokens, revokeAllTokens } from '../../services/authService';

// Build a minimal app with only the auth endpoints we need
function buildTestApp() {
  const testApp = express();
  testApp.use(cookieParser());
  testApp.use(express.json());

  testApp.post('/api/auth/forgot-password', sendPasswordResetOtp);
  testApp.post('/api/auth/verify-reset-otp', verifyPasswordResetOtp);
  testApp.post('/api/auth/reset-password', resetPassword);
  testApp.post('/api/auth/login', login);

  return testApp;
}

const app = buildTestApp();

// ── Test data ─────────────────────────────────────────────────────────────────

const USER_EMAIL = 'integration@test.com';
const OLD_PASSWORD = 'oldPassword123!';
const NEW_PASSWORD = 'brandNewPass456!';

const redisStore: Map<string, string> = (redisClient as any)._store;

// ═════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═════════════════════════════════════════════════════════════════════════════

describe('Integration — Bug 1 Fix: Password Reset End-to-End Flow', () => {
  let mockUser: any;

  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();

    // Restore mock implementations after clearAllMocks
    (redisClient.get as jest.Mock).mockImplementation(async (key: string) =>
      redisStore.get(key) ?? null
    );
    (redisClient.set as jest.Mock).mockImplementation(
      async (key: string, value: string, _mode?: string, _ttl?: number) => {
        redisStore.set(key, value);
        return 'OK';
      }
    );
    (redisClient.del as jest.Mock).mockImplementation(async (key: string) => {
      redisStore.delete(key);
      return 1;
    });

    // Build mock user
    mockUser = {
      _id: { toString: () => 'integration-user-id' },
      email: USER_EMAIL,
      password: `hashed::${OLD_PASSWORD}`,
      provider: 'local',
      role: 'customer',
      name: 'Integration Tester',
      failedLoginAttempts: 0,
      lockUntil: undefined,
      lastLoginAt: undefined,
      lastLoginIp: undefined,
      loginHistory: [],
      set: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    (User.findOne as jest.Mock).mockImplementation(({ email }: any) => {
      if (email !== USER_EMAIL) return Promise.resolve(null);
      // Support .select('+password') chain used by login controller
      // Return the SAME mockUser reference (not a spread copy) so password updates
      // from resetPassword are visible to subsequent login calls
      const promise: any = Promise.resolve(mockUser);
      promise.select = jest.fn().mockResolvedValue(mockUser);
      return promise;
    });

    // Mock issueTokens and revokeAllTokens
    (issueTokens as jest.Mock).mockImplementation(async (user: any) => ({
      accessToken: `access_token_for_${user.email}`,
    }));
    (revokeAllTokens as jest.Mock).mockResolvedValue(undefined);

    // Restore mocks cleared by clearAllMocks
    const { sendOTPEmail } = require('../../utils/email');
    (sendOTPEmail as jest.Mock).mockResolvedValue(true);

    const { hashPassword, comparePassword } = require('../../utils/password');
    (hashPassword as jest.Mock).mockImplementation(async (pw: string) => `hashed::${pw}`);
    (comparePassword as jest.Mock).mockImplementation(
      async (plain: string, hashed: string) => hashed === `hashed::${plain}`
    );
  });

  // ── Test 1: Full end-to-end flow ─────────────────────────────────────────

  it(
    'Full flow: forgot-password → seed OTP → verify-reset-otp → reset-password → ' +
    'login with new password succeeds (200) and with old password fails (401)',
    async () => {
      const OTP = '772233';
      const otpKey = `otp:reset:${USER_EMAIL}`;
      const verifiedFlagKey = `reset_verified:${USER_EMAIL}`;

      // ── STEP 1: POST /api/auth/forgot-password ─────────────────────────
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: USER_EMAIL });

      expect(forgotRes.status).toBe(200);

      // ── Seed OTP into Redis manually (simulating what the controller wrote) ─
      // The controller calls saveOTP which writes JSON to Redis.
      // In test NODE_ENV it also returns otp in body — use that if available,
      // otherwise seed our fixed OTP.
      const otp: string = forgotRes.body?.data?.otp ?? OTP;
      redisStore.set(otpKey, JSON.stringify({ otp, attempts: 0 }));

      expect(redisStore.has(otpKey)).toBe(true);

      // ── STEP 2: POST /api/auth/verify-reset-otp ───────────────────────
      const verifyRes = await request(app)
        .post('/api/auth/verify-reset-otp')
        .send({ email: USER_EMAIL, otp });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/OTP verified successfully/i),
      });

      // Verified flag must be set in Redis
      expect(redisStore.has(verifiedFlagKey)).toBe(true);
      expect(redisStore.get(verifiedFlagKey)).toBe('1');

      // OTP key must still be present (not deleted at verify — this is the fix)
      expect(redisStore.has(otpKey)).toBe(true);

      // ── STEP 3: POST /api/auth/reset-password ─────────────────────────
      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: USER_EMAIL, otp, newPassword: NEW_PASSWORD });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/password reset successfully/i),
      });

      // Both Redis keys must be cleaned up after reset
      expect(redisStore.has(otpKey)).toBe(false);
      expect(redisStore.has(verifiedFlagKey)).toBe(false);

      // revokeAllTokens was called
      expect(revokeAllTokens).toHaveBeenCalledWith('integration-user-id');

      // No need to manually update mockUser.password — the controller already mutated it:
      // user.password = await hashPassword(newPassword) directly modifies the mockUser object

      // ── STEP 4: Login with NEW password — must succeed (200) ──────────
      const loginNewRes = await request(app)
        .post('/api/auth/login')
        .send({ email: USER_EMAIL, password: NEW_PASSWORD });

      expect(loginNewRes.status).toBe(200);
      expect(loginNewRes.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/login successful/i),
      });

      // ── STEP 5: Login with OLD password — must fail (401) ─────────────
      const loginOldRes = await request(app)
        .post('/api/auth/login')
        .send({ email: USER_EMAIL, password: OLD_PASSWORD });

      expect(loginOldRes.status).toBe(401);
      expect(loginOldRes.body).toMatchObject({
        success: false,
      });
    }
  );

  // ── Test 2: resetPassword without verifying OTP first returns 400 ─────────

  it('POST /api/auth/reset-password without prior verify-reset-otp returns 400', async () => {
    // Redis is empty — no verified flag
    expect(redisStore.size).toBe(0);

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: USER_EMAIL, otp: '123456', newPassword: NEW_PASSWORD });

    expect(resetRes.status).toBe(400);
    expect(resetRes.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/OTP not verified or session expired/i),
    });
  });

  // ── Test 3: verify-reset-otp with wrong OTP does not set verified flag ─────

  it('POST /api/auth/verify-reset-otp with wrong OTP returns 400 and does not set verified flag', async () => {
    const CORRECT_OTP = '555555';
    const WRONG_OTP = '111111';
    const otpKey = `otp:reset:${USER_EMAIL}`;
    redisStore.set(otpKey, JSON.stringify({ otp: CORRECT_OTP, attempts: 0 }));

    const verifyRes = await request(app)
      .post('/api/auth/verify-reset-otp')
      .send({ email: USER_EMAIL, otp: WRONG_OTP });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/Invalid OTP/i),
    });

    // Verified flag must NOT be set
    expect(redisStore.has(`reset_verified:${USER_EMAIL}`)).toBe(false);
  });

});
