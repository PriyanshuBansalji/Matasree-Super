/**
 * Unit Tests — Bug 1 Fix: Password Reset Flow (verifyPasswordResetOtp + resetPassword)
 *
 * Tests:
 *  1. verifyPasswordResetOtp writes reset_verified:{email} with 600s TTL and does NOT delete otp:reset:{email}
 *  2. resetPassword reads verified flag (not raw OTP); returns 200 and updates password when flag present
 *  3. resetPassword returns 400 when verified flag is absent
 *  4. resetPassword deletes both otp:reset:{email} and reset_verified:{email} on success
 */

import { Request, Response } from 'express';

// ── Mocks (before imports) ───────────────────────────────────────────────────

jest.mock('../../config/redis', () => {
  const store = new Map<string, string>();
  const ttlStore = new Map<string, number>(); // track TTLs set via 'EX'

  const redisClient = {
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    set: jest.fn(async (key: string, value: string, mode?: string, ttl?: number) => {
      store.set(key, value);
      if (mode === 'EX' && ttl !== undefined) {
        ttlStore.set(key, ttl);
      }
      return 'OK';
    }),
    del: jest.fn(async (key: string) => {
      store.delete(key);
      ttlStore.delete(key);
      return 1;
    }),
    keys: jest.fn(async () => []),
    isUsingFallback: jest.fn(() => true),
    _store: store,
    _ttlStore: ttlStore,
  };

  return { redisClient };
});

jest.mock('../../models/User');

jest.mock('../../utils/email', () => ({
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendOTPSMS: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../services/authService', () => ({
  issueTokens: jest.fn().mockResolvedValue({ accessToken: 'mock-token' }),
  rotateRefreshToken: jest.fn(),
  revokeAllTokens: jest.fn().mockResolvedValue(undefined),
  revokeToken: jest.fn(),
  clearRefreshCookie: jest.fn(),
}));

jest.mock('../../middleware/auditLogger', () => ({
  logSecurityEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/password', () => ({
  hashPassword: jest.fn(async (pw: string) => `hashed_${pw}`),
  comparePassword: jest.fn().mockResolvedValue(true),
}));

// ── Imports ──────────────────────────────────────────────────────────────────

import { redisClient } from '../../config/redis';
import { verifyPasswordResetOtp, resetPassword } from '../authController';
import User from '../../models/User';
import { revokeAllTokens } from '../../services/authService';
import { hashPassword } from '../../utils/password';

// ── Test helpers ─────────────────────────────────────────────────────────────

function mockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.status = jest.fn((code: number) => { res.statusCode = code; return res; });
  res.json = jest.fn((body: any) => { res.body = body; return res; });
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(body: Record<string, any>) {
  return { body, headers: {}, ip: '127.0.0.1', cookies: {} } as unknown as Request;
}

function serializeOTP(otp: string, attempts = 0) {
  return JSON.stringify({ otp, attempts });
}

// Expose internal stores from mock
const redisStore: Map<string, string> = (redisClient as any)._store;
const redisTtlStore: Map<string, number> = (redisClient as any)._ttlStore;

// ── Mock user ─────────────────────────────────────────────────────────────────

const EMAIL = 'unit@test.com';
const OTP = '654321';
const NEW_PASSWORD = 'newPass123!';
const OTP_KEY = `otp:reset:${EMAIL}`;
const VERIFIED_FLAG_KEY = `reset_verified:${EMAIL}`;

const mockUser: any = {
  _id: { toString: () => 'user-unit-id' },
  email: EMAIL,
  password: 'hashed_old',
  save: jest.fn().mockResolvedValue(undefined),
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  redisStore.clear();
  redisTtlStore.clear();
  jest.clearAllMocks();

  (redisClient.get as jest.Mock).mockImplementation(async (key: string) =>
    redisStore.get(key) ?? null
  );
  (redisClient.set as jest.Mock).mockImplementation(
    async (key: string, value: string, mode?: string, ttl?: number) => {
      redisStore.set(key, value);
      if (mode === 'EX' && ttl !== undefined) redisTtlStore.set(key, ttl);
      return 'OK';
    }
  );
  (redisClient.del as jest.Mock).mockImplementation(async (key: string) => {
    redisStore.delete(key);
    redisTtlStore.delete(key);
    return 1;
  });

  (User.findOne as jest.Mock).mockResolvedValue(mockUser);
  mockUser.save = jest.fn().mockResolvedValue(undefined);
  mockUser.password = 'hashed_old';
  (revokeAllTokens as jest.Mock).mockResolvedValue(undefined);
  (hashPassword as jest.Mock).mockImplementation(async (pw: string) => `hashed_${pw}`);
});

// ═════════════════════════════════════════════════════════════════════════════
// UNIT TESTS
// ═════════════════════════════════════════════════════════════════════════════

describe('Unit tests — Bug 1 fix: verifyPasswordResetOtp and resetPassword', () => {

  // ── Test 1: verifyPasswordResetOtp writes verified flag and does NOT delete OTP key ──

  describe('verifyPasswordResetOtp', () => {

    it('writes reset_verified:{email} key with 600s TTL after successful OTP verification', async () => {
      // ARRANGE: seed the OTP key
      redisStore.set(OTP_KEY, serializeOTP(OTP));

      // ACT
      const req = mockReq({ email: EMAIL, otp: OTP });
      const res = mockRes();
      await verifyPasswordResetOtp(req, res);

      // ASSERT: response is 200
      expect(res.statusCode).toBe(200);

      // ASSERT: verified flag key was written
      expect(redisStore.has(VERIFIED_FLAG_KEY)).toBe(true);
      expect(redisStore.get(VERIFIED_FLAG_KEY)).toBe('1');

      // ASSERT: TTL is 600 seconds
      expect(redisTtlStore.get(VERIFIED_FLAG_KEY)).toBe(600);
    });

    it('does NOT delete otp:reset:{email} key after successful verification', async () => {
      // ARRANGE
      redisStore.set(OTP_KEY, serializeOTP(OTP));

      // ACT
      const req = mockReq({ email: EMAIL, otp: OTP });
      const res = mockRes();
      await verifyPasswordResetOtp(req, res);

      // ASSERT: OTP key still present (not deleted — resetPassword needs it for cleanup)
      expect(redisStore.has(OTP_KEY)).toBe(true);
    });

    it('returns 400 when OTP key is not in Redis (never requested or expired)', async () => {
      // ARRANGE: Redis is empty
      expect(redisStore.size).toBe(0);

      const req = mockReq({ email: EMAIL, otp: OTP });
      const res = mockRes();
      await verifyPasswordResetOtp(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
        message: expect.stringMatching(/OTP not found or expired/i),
      });
    });

    it('returns 400 on invalid OTP and does not write verified flag', async () => {
      // ARRANGE: seed with correct OTP
      redisStore.set(OTP_KEY, serializeOTP('000000'));

      // ACT: submit wrong OTP
      const req = mockReq({ email: EMAIL, otp: '999999' });
      const res = mockRes();
      await verifyPasswordResetOtp(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({ success: false, message: expect.stringMatching(/Invalid OTP/i) });

      // Verified flag must NOT be set
      expect(redisStore.has(VERIFIED_FLAG_KEY)).toBe(false);
    });

  });

  // ── Test 2: resetPassword reads verified flag and returns 200 when flag present ──

  describe('resetPassword — success path', () => {

    it('returns 200 and updates password when reset_verified:{email} flag is present', async () => {
      // ARRANGE: seed only the verified flag (OTP key not required in resetPassword post-fix)
      redisStore.set(VERIFIED_FLAG_KEY, '1');

      // ACT
      const req = mockReq({ email: EMAIL, otp: OTP, newPassword: NEW_PASSWORD });
      const res = mockRes();
      await resetPassword(req, res);

      // ASSERT: success response
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/password reset successfully/i),
      });

      // ASSERT: password was updated on the user document
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(mockUser.password).toBe(`hashed_${NEW_PASSWORD}`);
    });

    it('reads the verified flag key (NOT the raw OTP key) to authorize the reset', async () => {
      // ARRANGE: only the verified flag — NO otp:reset:{email} key present
      // Use a valid 6-digit OTP that is different from the one stored (OTP_KEY absent)
      // to confirm the fixed code never re-validates the raw OTP
      expect(redisStore.has(OTP_KEY)).toBe(false);
      redisStore.set(VERIFIED_FLAG_KEY, '1');

      const req = mockReq({ email: EMAIL, otp: '999999', newPassword: NEW_PASSWORD });
      const res = mockRes();
      await resetPassword(req, res);

      // Fixed code checks verified flag, ignoring whatever otp value was submitted — should succeed
      expect(res.statusCode).toBe(200);
    });

  });

  // ── Test 3: resetPassword returns 400 when verified flag is absent ──────────

  describe('resetPassword — flag absent', () => {

    it('returns 400 "OTP not verified or session expired" when no verified flag exists', async () => {
      // ARRANGE: empty Redis
      expect(redisStore.size).toBe(0);

      const req = mockReq({ email: EMAIL, otp: OTP, newPassword: NEW_PASSWORD });
      const res = mockRes();
      await resetPassword(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
        message: expect.stringMatching(/OTP not verified or session expired/i),
      });
    });

    it('returns 400 when verified flag was present but then deleted (simulates TTL expiry)', async () => {
      // ARRANGE: seed then delete (TTL expiry simulation)
      redisStore.set(VERIFIED_FLAG_KEY, '1');
      redisStore.delete(VERIFIED_FLAG_KEY);

      const req = mockReq({ email: EMAIL, otp: OTP, newPassword: NEW_PASSWORD });
      const res = mockRes();
      await resetPassword(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
        message: expect.stringMatching(/OTP not verified or session expired/i),
      });
    });

    it('returns 400 even when otp:reset:{email} key is present but verified flag is absent', async () => {
      // This confirms the fixed code does NOT fall back to raw OTP validation
      redisStore.set(OTP_KEY, serializeOTP(OTP));
      // No verified flag

      const req = mockReq({ email: EMAIL, otp: OTP, newPassword: NEW_PASSWORD });
      const res = mockRes();
      await resetPassword(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
        message: expect.stringMatching(/OTP not verified or session expired/i),
      });
    });

  });

  // ── Test 4: resetPassword deletes both keys on success ───────────────────────

  describe('resetPassword — cleanup on success', () => {

    it('deletes otp:reset:{email} key on successful password reset', async () => {
      // ARRANGE: seed both keys
      redisStore.set(OTP_KEY, serializeOTP(OTP));
      redisStore.set(VERIFIED_FLAG_KEY, '1');

      const req = mockReq({ email: EMAIL, otp: OTP, newPassword: NEW_PASSWORD });
      const res = mockRes();
      await resetPassword(req, res);

      expect(res.statusCode).toBe(200);

      // ASSERT: otp:reset:{email} key is deleted
      expect(redisStore.has(OTP_KEY)).toBe(false);
    });

    it('deletes reset_verified:{email} flag key on successful password reset', async () => {
      // ARRANGE: seed both keys
      redisStore.set(OTP_KEY, serializeOTP(OTP));
      redisStore.set(VERIFIED_FLAG_KEY, '1');

      const req = mockReq({ email: EMAIL, otp: OTP, newPassword: NEW_PASSWORD });
      const res = mockRes();
      await resetPassword(req, res);

      expect(res.statusCode).toBe(200);

      // ASSERT: reset_verified:{email} key is deleted
      expect(redisStore.has(VERIFIED_FLAG_KEY)).toBe(false);
    });

    it('deletes both keys and Redis store is empty after success (both seeded)', async () => {
      // ARRANGE
      redisStore.set(OTP_KEY, serializeOTP(OTP));
      redisStore.set(VERIFIED_FLAG_KEY, '1');
      expect(redisStore.size).toBe(2);

      const req = mockReq({ email: EMAIL, otp: OTP, newPassword: NEW_PASSWORD });
      const res = mockRes();
      await resetPassword(req, res);

      expect(res.statusCode).toBe(200);

      // Both keys gone
      expect(redisStore.has(OTP_KEY)).toBe(false);
      expect(redisStore.has(VERIFIED_FLAG_KEY)).toBe(false);
    });

    it('calls revokeAllTokens with the user id on success', async () => {
      redisStore.set(VERIFIED_FLAG_KEY, '1');

      const req = mockReq({ email: EMAIL, otp: OTP, newPassword: NEW_PASSWORD });
      const res = mockRes();
      await resetPassword(req, res);

      expect(revokeAllTokens).toHaveBeenCalledTimes(1);
      expect(revokeAllTokens).toHaveBeenCalledWith('user-unit-id');
    });

  });

  // ── Full two-step flow unit test ─────────────────────────────────────────────

  describe('Full two-step flow: verifyPasswordResetOtp → resetPassword', () => {

    it('complete flow: verify OTP then reset password returns 200 and updates password', async () => {
      // ARRANGE: seed OTP key as if sendPasswordResetOtp ran
      redisStore.set(OTP_KEY, serializeOTP(OTP));

      // STEP 1: verify OTP
      const verifyReq = mockReq({ email: EMAIL, otp: OTP });
      const verifyRes = mockRes();
      await verifyPasswordResetOtp(verifyReq, verifyRes);
      expect(verifyRes.statusCode).toBe(200);

      // Verify flag set, OTP key still there
      expect(redisStore.has(VERIFIED_FLAG_KEY)).toBe(true);
      expect(redisStore.has(OTP_KEY)).toBe(true);

      // STEP 2: reset password
      const resetReq = mockReq({ email: EMAIL, otp: OTP, newPassword: NEW_PASSWORD });
      const resetRes = mockRes();
      await resetPassword(resetReq, resetRes);

      // Succeeds with 200
      expect(resetRes.statusCode).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Both keys cleaned up
      expect(redisStore.has(OTP_KEY)).toBe(false);
      expect(redisStore.has(VERIFIED_FLAG_KEY)).toBe(false);
    });

  });

});
