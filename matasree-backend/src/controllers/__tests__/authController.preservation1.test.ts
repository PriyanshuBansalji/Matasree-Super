/**
 * Preservation Property Tests — Bug 1: Password Reset (AFTER fix)
 *
 * PURPOSE: Verify the correct rejection behavior of the FIXED `resetPassword`.
 *   These tests confirm behaviors preserved by the fix: unverified/absent sessions
 *   still return 400, schema validation still works, and the verified flag (alone)
 *   is correctly accepted.
 *
 * Property 2: Preservation — Unverified Session Rejection Still Returns 400
 *
 *   - No verified flag present → resetPassword returns 400 "OTP not verified or session expired"
 *   - Verified flag expired (deleted) → resetPassword returns 400 "OTP not verified or session expired"
 *   - Multiple email/otp combos with no verified flag → all return 400
 *   - Only `reset_verified:{email}` key present (the correct fixed behavior) → returns 200
 *   - Invalid schema input → resetPassword returns 400 (not 500)
 *
 * EXPECTED OUTCOME: ALL tests PASS on FIXED authController.ts
 *
 * Validates: Requirements 1.3
 */

import { Request, Response } from 'express';

// ── Mock heavy dependencies BEFORE importing the controller ──────────────────

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

// ── Imports (after mocks are set up) ─────────────────────────────────────────
import { redisClient } from '../../config/redis';
import { resetPassword } from '../authController';
import User from '../../models/User';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function mockReq(body: Record<string, any>) {
  return { body, headers: {}, ip: '127.0.0.1', cookies: {} } as unknown as Request;
}

/** Serialize OTP the same way saveOTP() does in authController */
function serializeOTP(otp: string, attempts = 0) {
  return JSON.stringify({ otp, attempts });
}

// ── Access the internal Redis store ──────────────────────────────────────────
const redisStore: Map<string, string> = (redisClient as any)._store;

// ── Mock user ─────────────────────────────────────────────────────────────────
const mockUser: any = {
  _id: { toString: () => 'user-id-123' },
  email: 'user@test.com',
  password: 'hashed_old',
  save: jest.fn().mockResolvedValue(undefined),
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  redisStore.clear();
  jest.clearAllMocks();

  // Re-attach implementations after clearAllMocks
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

  (User.findOne as jest.Mock).mockResolvedValue(mockUser);
  mockUser.save = jest.fn().mockResolvedValue(undefined);
});

// ═════════════════════════════════════════════════════════════════════════════
// PRESERVATION TESTS — all must PASS on unfixed authController.ts
// ═════════════════════════════════════════════════════════════════════════════

describe('Property 2: Preservation — Unverified OTP Rejection Still Returns 400', () => {
  const EMAIL = 'user@test.com';
  const OTP = '123456';
  const OTP_KEY = `otp:reset:${EMAIL}`;
  const VERIFIED_FLAG_KEY = `reset_verified:${EMAIL}`;
  const NEW_PASSWORD = 'newSecurePass1!';

  // ── Test 1: No verified flag present (verifyPasswordResetOtp was never called) ────────

  it(
    'Test 1: Returns 400 "OTP not verified or session expired" when no reset_verified:{email} key exists in Redis',
    async () => {
      // ARRANGE: Redis is empty — verifyPasswordResetOtp was never called
      expect(redisStore.size).toBe(0);

      // ACT
      const req = mockReq({ email: EMAIL, otp: OTP, newPassword: NEW_PASSWORD });
      const res = mockRes();
      await resetPassword(req, res);

      // ASSERT
      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
        message: expect.stringMatching(/OTP not verified or session expired/i),
      });
    }
  );

  // ── Test 2: Verified flag expired (key was deleted from Redis, simulating TTL expiry) ──

  it(
    'Test 2: Returns 400 "OTP not verified or session expired" when reset_verified:{email} key was seeded then deleted (expiry simulation)',
    async () => {
      // ARRANGE: Seed the verified flag, then delete it (simulating Redis TTL expiry)
      redisStore.set(VERIFIED_FLAG_KEY, '1');
      expect(redisStore.has(VERIFIED_FLAG_KEY)).toBe(true);
      redisStore.delete(VERIFIED_FLAG_KEY); // simulate expiry
      expect(redisStore.has(VERIFIED_FLAG_KEY)).toBe(false);

      // ACT
      const req = mockReq({ email: EMAIL, otp: OTP, newPassword: NEW_PASSWORD });
      const res = mockRes();
      await resetPassword(req, res);

      // ASSERT
      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
        message: expect.stringMatching(/OTP not verified or session expired/i),
      });
    }
  );

  // ── Test 3: No verified flag — OTP key present alone is NOT sufficient ──────────────

  it(
    'Test 3: Returns 400 "OTP not verified or session expired" when otp:reset:{email} key exists but no verified flag',
    async () => {
      // ARRANGE: Seed the OTP key but NOT the verified flag
      redisStore.set(OTP_KEY, serializeOTP('123456'));
      expect(redisStore.has(OTP_KEY)).toBe(true);
      expect(redisStore.has(VERIFIED_FLAG_KEY)).toBe(false);

      // ACT
      const req = mockReq({ email: EMAIL, otp: '123456', newPassword: NEW_PASSWORD });
      const res = mockRes();
      await resetPassword(req, res);

      // ASSERT — resetPassword now checks verified flag, not the raw OTP
      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
        message: expect.stringMatching(/OTP not verified or session expired/i),
      });
    }
  );

  // ── Test 4: Property-based / parameterized — multiple inputs, no verified flag seeded ─

  it(
    'Test 4 (parameterized): All email/otp combinations without seeded reset_verified:{email} key return 400',
    async () => {
      const inputs = [
        { email: 'alice@example.com', otp: '111111', newPassword: 'password1!' },
        { email: 'bob@example.com', otp: '222222', newPassword: 'password2!' },
        { email: 'carol@example.com', otp: '333333', newPassword: 'password3!' },
        { email: 'dave@domain.org', otp: '444444', newPassword: 'password4!' },
        { email: 'eve@mail.net', otp: '555555', newPassword: 'password5!' },
        { email: 'frank@test.io', otp: '000000', newPassword: 'password6!' },
      ];

      for (const input of inputs) {
        // ARRANGE: ensure no verified flag for this email exists
        redisStore.delete(`reset_verified:${input.email}`);

        (User.findOne as jest.Mock).mockResolvedValue({
          ...mockUser,
          email: input.email,
          save: jest.fn().mockResolvedValue(undefined),
        });

        // ACT
        const req = mockReq(input);
        const res = mockRes();
        await resetPassword(req, res);

        // ASSERT
        expect(res.statusCode).toBe(400);
        expect(res.body).toMatchObject({
          success: false,
          message: expect.stringMatching(/OTP not verified or session expired/i),
        });
      }
    }
  );

  // ── Test 5: reset_verified:{email} key present → resetPassword SUCCEEDS (fixed behavior) ──

  it(
    'Test 5: Returns 200 when reset_verified:{email} = "1" is set — verified flag alone is sufficient (fixed behavior)',
    async () => {
      // ARRANGE: Only seed the verified flag key (OTP key not needed for resetPassword post-fix)
      redisStore.set(VERIFIED_FLAG_KEY, '1');
      expect(redisStore.has(VERIFIED_FLAG_KEY)).toBe(true);
      expect(redisStore.has(OTP_KEY)).toBe(false);

      // ACT
      const req = mockReq({ email: EMAIL, otp: OTP, newPassword: NEW_PASSWORD });
      const res = mockRes();
      await resetPassword(req, res);

      // ASSERT: fixed code reads reset_verified:{email} and finds it → 200
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/password reset successfully/i),
      });
    }
  );

  // ── Test 6: Invalid schema input returns 400 (not 500) ──────────────────────

  it(
    'Test 6: Returns 400 (schema validation error) when required fields are missing — not 500',
    async () => {
      // ACT: empty body — missing email, otp, newPassword
      const req = mockReq({});
      const res = mockRes();
      await resetPassword(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
      });
    }
  );

  it(
    'Test 6b: Returns 400 when only email is provided (missing otp and newPassword)',
    async () => {
      const req = mockReq({ email: EMAIL });
      const res = mockRes();
      await resetPassword(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({ success: false });
    }
  );

  it(
    'Test 6c: Returns 400 when newPassword is too short (schema validation)',
    async () => {
      // Seed a valid OTP so schema is the only potential failure point
      redisStore.set(OTP_KEY, serializeOTP(OTP));

      const req = mockReq({ email: EMAIL, otp: OTP, newPassword: 'abc' }); // min 6
      const res = mockRes();
      await resetPassword(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({ success: false });
    }
  );

  // ── Test 7: otp:reset:{email} key exists BUT no verified flag — parameterized ──
  // NOTE: In the fixed code, resetPassword checks the verified flag (reset_verified:{email}),
  // NOT the raw OTP. So seeding only the OTP key (without the verified flag) still returns
  // "OTP not verified or session expired" — the fixed code never reaches OTP comparison.

  it(
    'Test 7 (parameterized): Returns 400 "OTP not verified or session expired" for all wrong OTP values when only OTP key seeded (no verified flag)',
    async () => {
      const CORRECT_OTP = '654321';
      redisStore.set(OTP_KEY, serializeOTP(CORRECT_OTP));

      const wrongOtps = ['000000', '111111', '654320', '654322', '999999', '123456'];

      for (const wrongOtp of wrongOtps) {
        // Re-seed for each iteration
        redisStore.set(OTP_KEY, serializeOTP(CORRECT_OTP));
        // Ensure verified flag is NOT present
        redisStore.delete(`reset_verified:${EMAIL}`);

        const req = mockReq({ email: EMAIL, otp: wrongOtp, newPassword: NEW_PASSWORD });
        const res = mockRes();
        await resetPassword(req, res);

        // Fixed code checks verified flag first — no verified flag → 400 "OTP not verified or session expired"
        expect(res.statusCode).toBe(400);
        expect(res.body).toMatchObject({
          success: false,
          message: expect.stringMatching(/OTP not verified or session expired/i),
        });
      }
    }
  );
});
