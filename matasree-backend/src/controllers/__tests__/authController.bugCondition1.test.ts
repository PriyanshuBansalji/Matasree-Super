/**
 * Bug Condition Exploration Test — Bug 1: Password Reset Flow Broken
 *
 * PURPOSE (Approach B): Assert CORRECT behavior so the test FAILS on buggy (unfixed) code.
 *   - After verifyPasswordResetOtp succeeds, calling resetPassword within the TTL SHOULD return 200.
 *   - On unfixed code the test FAILS because verifyPasswordResetOtp deletes the OTP key from
 *     Redis at step 1, leaving resetPassword unable to find it at step 2 → 400 instead of 200.
 *
 * DOCUMENTED COUNTEREXAMPLE (from unfixed code):
 *   { email: "user@test.com", otp: "123456", timeBetweenCalls: ~0ms (immediate) }
 *   → resetPassword returns HTTP 400 "OTP not found or expired" instead of HTTP 200
 *
 * Validates: Requirements 1.1, 1.2
 */

import { Request, Response } from 'express';

// ── Mock heavy dependencies BEFORE importing the controller ──────────────────

// Mock Redis so no real connection is attempted
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
    _store: store, // expose for test assertions
  };

  return { redisClient };
});

// Mock MongoDB / User model — no real DB needed
jest.mock('../../models/User');

// Mock email sending — avoid real SMTP calls
jest.mock('../../utils/email', () => ({
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendOTPSMS: jest.fn().mockResolvedValue(true),
}));

// Mock authService token functions — not needed for OTP/reset flow
jest.mock('../../services/authService', () => ({
  issueTokens: jest.fn().mockResolvedValue({ accessToken: 'mock-token' }),
  rotateRefreshToken: jest.fn(),
  revokeAllTokens: jest.fn().mockResolvedValue(undefined),
  revokeToken: jest.fn(),
  clearRefreshCookie: jest.fn(),
}));

// Mock auditLogger
jest.mock('../../middleware/auditLogger', () => ({
  logSecurityEvent: jest.fn().mockResolvedValue(undefined),
}));

// Mock password utilities
jest.mock('../../utils/password', () => ({
  hashPassword: jest.fn(async (pw: string) => `hashed_${pw}`),
  comparePassword: jest.fn().mockResolvedValue(true),
}));

// ── Imports (after mocks are set up) ─────────────────────────────────────────
import { redisClient } from '../../config/redis';
import { verifyPasswordResetOtp, resetPassword } from '../authController';
import User from '../../models/User';
import { revokeAllTokens } from '../../services/authService';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal Express-like mock Response that captures status + json calls */
function mockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((body: any) => {
    res.body = body;
    return res;
  });
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
}

/** Build a minimal Express-like mock Request */
function mockReq(body: Record<string, any>) {
  return { body, headers: {}, ip: '127.0.0.1', cookies: {} } as unknown as Request;
}

/** Serialize OTP the same way saveOTP() does in authController */
function serializeOTP(otp: string, attempts = 0) {
  return JSON.stringify({ otp, attempts });
}

// ── Access the internal Redis store exposed by our mock ───────────────────────
const redisStore: Map<string, string> = (redisClient as any)._store;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Bug 1: Password Reset Flow — OTP Deleted at Verification Step', () => {
  const EMAIL = 'user@test.com';
  const OTP = '123456';
  const OTP_KEY = `otp:reset:${EMAIL}`;
  const NEW_PASSWORD = 'newSecurePass1!';

  // Mock a user that exists in DB
  const mockUser: any = {
    _id: { toString: () => 'user-id-123' },
    email: EMAIL,
    password: 'hashed_old',
    save: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    // Clear the store and reset all mock call history before each test
    redisStore.clear();
    jest.clearAllMocks();

    // Re-attach the store reference (clearAllMocks resets the fn but not the closure store)
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

    // Mock User.findOne to return our test user
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    // Reset save mock
    mockUser.save = jest.fn().mockResolvedValue(undefined);
    (revokeAllTokens as jest.Mock).mockResolvedValue(undefined);
  });

  // ── Property 1: Bug Condition Test ─────────────────────────────────────────
  it(
    'Property 1 (Bug Condition): resetPassword returns HTTP 200 after verifyPasswordResetOtp succeeds — ' +
    'FAILS on unfixed code because verifyPasswordResetOtp deletes the OTP key at step 1',
    async () => {
      // ── ARRANGE ────────────────────────────────────────────────────────────
      // Seed Redis with OTP key (as saveOTP() would store it)
      redisStore.set(OTP_KEY, serializeOTP(OTP));

      // Confirm key is seeded
      expect(await redisClient.get(OTP_KEY)).not.toBeNull();

      // ── ACT Step 1: Call verifyPasswordResetOtp ────────────────────────────
      const verifyReq = mockReq({ email: EMAIL, otp: OTP });
      const verifyRes = mockRes();

      await verifyPasswordResetOtp(verifyReq, verifyRes);

      // Verify step 1 succeeded with 200
      expect(verifyRes.statusCode).toBe(200);

      // ── ASSERT (Bug detection): OTP key is deleted after verification ───────
      // On unfixed code this assertion PASSES — the OTP IS deleted (this is the bug).
      // After the fix, this assertion should FAIL because the key should still exist.
      const keyAfterVerify = await redisClient.get(OTP_KEY);
      // Document the bug: key is null immediately after verify
      // (This is the root cause — deleteOTP is called before resetPassword can use it)

      // ── ACT Step 2: Call resetPassword immediately (within TTL) ───────────
      const resetReq = mockReq({ email: EMAIL, otp: OTP, newPassword: NEW_PASSWORD });
      const resetRes = mockRes();

      await resetPassword(resetReq, resetRes);

      // ── ASSERT (Correct behavior): resetPassword SHOULD return 200 ────────
      // On UNFIXED code: this FAILS — actual status is 400 "OTP not found or expired"
      // because verifyPasswordResetOtp already deleted the key.
      // On FIXED code: this PASSES — resetPassword checks verified flag, not raw OTP key.
      expect(resetRes.statusCode).toBe(200);
      expect(resetRes.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/password reset successfully/i),
      });
    }
  );

  // ── Supplementary assertion: document the FIXED behavior ──────────────────
  it(
    'Documents the fix: OTP key is retained after verifyPasswordResetOtp and a reset_verified flag is written — ' +
    'proves the root cause of the old 400 has been eliminated',
    async () => {
      // Seed Redis
      redisStore.set(OTP_KEY, serializeOTP(OTP));

      const verifyReq = mockReq({ email: EMAIL, otp: OTP });
      const verifyRes = mockRes();

      await verifyPasswordResetOtp(verifyReq, verifyRes);

      // On FIXED code: deleteOTP(key) is NOT called → original OTP key is retained
      const keyAfterVerify = await redisClient.get(OTP_KEY);
      expect(keyAfterVerify).not.toBeNull(); // ← The OTP was NOT deleted (fix confirmed)

      // On FIXED code: a short-lived verified flag is written instead
      const verifiedFlag = await redisClient.get(`reset_verified:${EMAIL}`);
      expect(verifiedFlag).toBe('1'); // ← The verified flag was written (fix confirmed)

      // Consequence: subsequent resetPassword call now returns 200
      const resetReq = mockReq({ email: EMAIL, otp: OTP, newPassword: NEW_PASSWORD });
      const resetRes = mockRes();
      await resetPassword(resetReq, resetRes);

      // This assertion PASSES on FIXED code (documents the symptom is resolved):
      expect(resetRes.statusCode).toBe(200);
      expect(resetRes.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/password reset successfully/i),
      });
    }
  );
});
