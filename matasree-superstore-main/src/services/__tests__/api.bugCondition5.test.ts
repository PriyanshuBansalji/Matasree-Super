/**
 * Bug Condition Exploration Test — Bug 5: Referral API 404
 *
 * Task 17: Write bug condition exploration test — Referral API 404
 * Property 1: Bug Condition — Plural Path Returns 404 / Missing Typed Methods
 *
 * **Validates: Requirements 5.1, 5.2**
 *
 * CRITICAL: This test is designed to FAIL on UNFIXED code.
 * Failure confirms the bug exists. DO NOT attempt to fix the code when it fails.
 *
 * Bug condition (isBugCondition_5):
 *   - ApiClient has NO typed getReferralCode, getReferralHistory, applyReferralCode methods.
 *   - Any callsite that uses the plural path /referrals/* will receive a 404 because
 *     the backend mounts referral routes at /referral/* (singular).
 *
 * Documented counterexamples (on UNFIXED api.ts):
 *   - typeof apiClient.getReferralCode      === "undefined"  (not a function)
 *   - typeof apiClient.getReferralHistory   === "undefined"  (not a function)
 *   - typeof apiClient.applyReferralCode    === "undefined"  (not a function)
 *   - apiClient.get('/referrals/my-code')   → throws AxiosError { response.status: 404 }
 *   - apiClient.get('/referrals/history')   → throws AxiosError { response.status: 404 }
 *   - apiClient.post('/referrals/apply', …) → throws AxiosError { response.status: 404 }
 *
 * EXPECTED TEST OUTCOME on UNFIXED code: 6 tests FAIL  → bug confirmed
 * EXPECTED TEST OUTCOME on FIXED code:   all tests PASS → bug resolved
 */

import { vi, describe, it, expect, afterEach } from 'vitest';

// ─── Mock axios to simulate the backend router ──────────────────────────────
//
// Routing rules mirrored from referralRoutes.ts:
//   Singular paths  /referral/*   → HTTP 200  (routes exist)
//   Plural paths    /referrals/*  → HTTP 404  (no such routes — the bug condition)
//   All other paths               → HTTP 200

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();

  const mockAxiosInstance = {
    get: vi.fn(async (url: string) => {
      // Plural referral paths → 404 (backend has no /referrals/* routes)
      if (url.includes('/referrals/')) {
        const err: any = new Error('Request failed with status code 404');
        err.response = { status: 404, data: { message: 'Not Found' } };
        err.isAxiosError = true;
        throw err;
      }
      // Singular referral paths → 200 (correct backend routes)
      if (url.includes('/referral/')) {
        return { status: 200, data: { success: true, data: { code: 'REF-TEST-123' } } };
      }
      return { status: 200, data: {} };
    }),
    post: vi.fn(async (url: string) => {
      if (url.includes('/referrals/')) {
        const err: any = new Error('Request failed with status code 404');
        err.response = { status: 404, data: { message: 'Not Found' } };
        err.isAxiosError = true;
        throw err;
      }
      if (url.includes('/referral/')) {
        return { status: 200, data: { success: true, data: {} } };
      }
      return { status: 200, data: {} };
    }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: { baseURL: 'http://localhost:5001/api', headers: { common: {} } },
  };

  const create = vi.fn(() => mockAxiosInstance);

  return {
    default: { ...actual.default, create },
    create,
  };
});

// ─── Import apiClient AFTER mocking axios ────────────────────────────────────
// Dynamic import ensures the axios mock is in place before ApiClient initializes.

// ============================================================
// Suite 1: Missing Typed Methods (structural assertions)
// ============================================================

describe('Bug 5 — Referral API: Missing Typed Methods on ApiClient (Task 17)', () => {
  /**
   * isBugCondition_5: typedMethodExists = false
   *
   * On UNFIXED api.ts, none of the three referral methods exist on ApiClient.
   * These tests assert they SHOULD be functions → FAIL on unfixed code → bug confirmed.
   */

  it('BUG CONDITION: apiClient.getReferralCode must be a typed method — FAILS on unfixed code', async () => {
    const { apiClient } = await import('@/services/api');

    // EXPECTED (fixed):  typeof apiClient.getReferralCode === 'function'
    // ACTUAL (unfixed):  typeof apiClient.getReferralCode === 'undefined'  → FAILS → bug confirmed
    expect(
      typeof (apiClient as any).getReferralCode,
      'Counterexample: typeof apiClient.getReferralCode === "undefined" on unfixed api.ts.\n' +
      'Bug: no typed getReferralCode method exists — callers must use raw URLs with risk of plural-path 404.'
    ).toBe('function');
  });

  it('BUG CONDITION: apiClient.getReferralHistory must be a typed method — FAILS on unfixed code', async () => {
    const { apiClient } = await import('@/services/api');

    // ACTUAL (unfixed): 'undefined'  → FAILS → bug confirmed
    expect(
      typeof (apiClient as any).getReferralHistory,
      'Counterexample: typeof apiClient.getReferralHistory === "undefined" on unfixed api.ts.\n' +
      'Bug: no typed getReferralHistory method exists.'
    ).toBe('function');
  });

  it('BUG CONDITION: apiClient.applyReferralCode must be a typed method — FAILS on unfixed code', async () => {
    const { apiClient } = await import('@/services/api');

    // ACTUAL (unfixed): 'undefined'  → FAILS → bug confirmed
    expect(
      typeof (apiClient as any).applyReferralCode,
      'Counterexample: typeof apiClient.applyReferralCode === "undefined" on unfixed api.ts.\n' +
      'Bug: no typed applyReferralCode method exists.'
    ).toBe('function');
  });
});

// ============================================================
// Suite 2: Plural Paths Return 404 (runtime assertions)
// ============================================================

describe('Bug 5 — Referral API: Plural Paths Return 404 (Task 17)', () => {
  /**
   * isBugCondition_5: calledPath NOT IN canonical_referral_paths
   *
   * Backend routes are mounted at /api/referral/* (singular).
   * Calling /referrals/* (plural) returns 404.
   *
   * Each test calls the plural path, catches the error, then asserts the
   * response status is NOT 404.  On unfixed code this assertion FAILS because
   * the status IS 404  → confirms the bug.
   */

  afterEach(() => {
    vi.clearAllMocks();
  });

  it(
    'BUG CONDITION: GET /referrals/my-code (plural) must NOT return 404 — FAILS on unfixed code',
    async () => {
      const { apiClient } = await import('@/services/api');

      let caughtStatus: number | null = null;
      try {
        await (apiClient as any).get('/referrals/my-code');
      } catch (err: any) {
        caughtStatus = err?.response?.status ?? null;
      }

      // ACTUAL (unfixed): caughtStatus === 404  → assertion FAILS → bug confirmed
      // Counterexample: apiClient.get('/referrals/my-code') → HTTP 404
      expect(
        caughtStatus,
        'Counterexample: apiClient.get("/referrals/my-code") → HTTP 404.\n' +
        'Bug: plural path /referrals/my-code not registered on backend (routes are at /referral/my-code).'
      ).not.toBe(404);
    }
  );

  it(
    'BUG CONDITION: GET /referrals/history (plural) must NOT return 404 — FAILS on unfixed code',
    async () => {
      const { apiClient } = await import('@/services/api');

      let caughtStatus: number | null = null;
      try {
        await (apiClient as any).get('/referrals/history');
      } catch (err: any) {
        caughtStatus = err?.response?.status ?? null;
      }

      // Counterexample: apiClient.get('/referrals/history') → HTTP 404
      expect(
        caughtStatus,
        'Counterexample: apiClient.get("/referrals/history") → HTTP 404.\n' +
        'Bug: plural path /referrals/history not registered on backend (routes are at /referral/history).'
      ).not.toBe(404);
    }
  );

  it(
    'BUG CONDITION: POST /referrals/apply (plural) must NOT return 404 — FAILS on unfixed code',
    async () => {
      const { apiClient } = await import('@/services/api');

      let caughtStatus: number | null = null;
      try {
        await (apiClient as any).post('/referrals/apply', { code: 'TEST-CODE' });
      } catch (err: any) {
        caughtStatus = err?.response?.status ?? null;
      }

      // Counterexample: apiClient.post('/referrals/apply', …) → HTTP 404
      expect(
        caughtStatus,
        'Counterexample: apiClient.post("/referrals/apply", { code }) → HTTP 404.\n' +
        'Bug: plural path /referrals/apply not registered on backend (routes are at /referral/apply).'
      ).not.toBe(404);
    }
  );
});

// ============================================================
// Suite 3: Baseline — Singular Paths Work (these PASS on both fixed and unfixed code)
// ============================================================

describe('Bug 5 — Referral API: Singular Paths Baseline (Task 17)', () => {
  /**
   * Verify that the canonical /referral/* paths (singular) do NOT return 404.
   * These serve as documentation: the fix must ensure typed methods always
   * hit these singular paths.
   *
   * These tests PASS on both unfixed and fixed code.
   */

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('baseline: GET /referral/my-code (singular) does NOT return 404', async () => {
    const { apiClient } = await import('@/services/api');

    let caughtStatus: number | null = null;
    try {
      await (apiClient as any).get('/referral/my-code');
    } catch (err: any) {
      caughtStatus = err?.response?.status ?? null;
    }

    expect(caughtStatus).not.toBe(404);
  });

  it('baseline: GET /referral/history (singular) does NOT return 404', async () => {
    const { apiClient } = await import('@/services/api');

    let caughtStatus: number | null = null;
    try {
      await (apiClient as any).get('/referral/history');
    } catch (err: any) {
      caughtStatus = err?.response?.status ?? null;
    }

    expect(caughtStatus).not.toBe(404);
  });

  it('baseline: POST /referral/apply (singular) does NOT return 404', async () => {
    const { apiClient } = await import('@/services/api');

    let caughtStatus: number | null = null;
    try {
      await (apiClient as any).post('/referral/apply', { code: 'TEST-CODE' });
    } catch (err: any) {
      caughtStatus = err?.response?.status ?? null;
    }

    expect(caughtStatus).not.toBe(404);
  });
});
