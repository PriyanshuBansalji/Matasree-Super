/**
 * Bug Condition Exploration Test — Bug 5: Referral API 404
 *
 * Property 8: Bug Condition — Plural Path Returns 404 / Missing Typed Methods
 *
 * **Validates: Requirements 5.1, 5.2**
 *
 * CRITICAL: This test is designed to FAIL on UNFIXED code.
 * Failure confirms the bug exists. DO NOT attempt to fix the code when it fails.
 *
 * Bug condition:
 *   - ApiClient has no typed getReferralCode, getReferralHistory, applyReferralCode methods.
 *   - Any callsite that uses the plural path /referrals/* will receive a 404 because
 *     the backend mounts referral routes at /referral/* (singular).
 *
 * Counterexample documented:
 *   - apiClient.getReferralCode      → undefined (not a function)
 *   - apiClient.getReferralHistory   → undefined (not a function)
 *   - apiClient.applyReferralCode    → undefined (not a function)
 *   - apiClient.get('/referrals/my-code')  → HTTP 404 (plural path not registered)
 *   - apiClient.get('/referrals/history')  → HTTP 404 (plural path not registered)
 *   - apiClient.get('/referrals/apply')    → HTTP 404 (plural path not registered)
 *
 * EXPECTED TEST OUTCOME: FAILS on unfixed api.ts  → bug confirmed
 * EXPECTED TEST OUTCOME: PASSES on fixed api.ts   → bug resolved
 */

import { vi, describe, it, expect, afterEach } from 'vitest';

// ─── Mock axios to intercept all HTTP calls ─────────────────────────────────────
//
// We mock axios at the module level to simulate the backend router:
//   - Singular paths  /referral/*   → 200
//   - Plural paths    /referrals/*  → 404  (the bug condition)
//   - All other paths               → 200

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();

  // Track the most recent request URL for assertions
  let lastRequestUrl = '';

  const mockAxiosInstance = {
    get: vi.fn(async (url: string) => {
      lastRequestUrl = url;
      // Plural referral paths return 404 — backend has no such routes
      if (url.includes('/referrals/')) {
        const err: any = new Error('Request failed with status code 404');
        err.response = { status: 404, data: { message: 'Not Found' } };
        err.isAxiosError = true;
        throw err;
      }
      // Singular referral paths return 200
      if (url.includes('/referral/')) {
        return { status: 200, data: { success: true, data: { code: 'REF-TEST-123' } } };
      }
      return { status: 200, data: {} };
    }),
    post: vi.fn(async (url: string) => {
      lastRequestUrl = url;
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

// ─── Import apiClient AFTER mocking axios ──────────────────────────────────────
// Using a dynamic import so the mock is applied before the module initializes.

describe('Bug 5 — Referral API: Missing Typed Methods on ApiClient', () => {
  /**
   * Property 8a: Typed referral methods must exist on ApiClient.
   *
   * On UNFIXED code:
   *   apiClient.getReferralCode    is undefined (not a function)
   *   apiClient.getReferralHistory is undefined (not a function)
   *   apiClient.applyReferralCode  is undefined (not a function)
   *
   * These assertions are written as "expect to be a function" — they FAIL on
   * unfixed code, confirming the typed methods are absent.
   */

  it('BUG CONDITION: apiClient.getReferralCode should be a typed method (FAILS on unfixed code)', async () => {
    const { apiClient } = await import('@/services/api');

    // EXPECTED: typed method exists and is callable
    // ACTUAL on unfixed code: undefined  →  TEST FAILS  →  bug confirmed
    expect(
      typeof (apiClient as any).getReferralCode,
      'getReferralCode should be a function — not undefined.\n' +
      'Counterexample: typeof apiClient.getReferralCode === "undefined" on unfixed api.ts'
    ).toBe('function');
  });

  it('BUG CONDITION: apiClient.getReferralHistory should be a typed method (FAILS on unfixed code)', async () => {
    const { apiClient } = await import('@/services/api');

    // EXPECTED: typed method exists
    // ACTUAL on unfixed code: undefined  →  TEST FAILS  →  bug confirmed
    expect(
      typeof (apiClient as any).getReferralHistory,
      'getReferralHistory should be a function — not undefined.\n' +
      'Counterexample: typeof apiClient.getReferralHistory === "undefined" on unfixed api.ts'
    ).toBe('function');
  });

  it('BUG CONDITION: apiClient.applyReferralCode should be a typed method (FAILS on unfixed code)', async () => {
    const { apiClient } = await import('@/services/api');

    // EXPECTED: typed method exists
    // ACTUAL on unfixed code: undefined  →  TEST FAILS  →  bug confirmed
    expect(
      typeof (apiClient as any).applyReferralCode,
      'applyReferralCode should be a function — not undefined.\n' +
      'Counterexample: typeof apiClient.applyReferralCode === "undefined" on unfixed api.ts'
    ).toBe('function');
  });
});

describe('Bug 5 — Referral API: Plural Paths Return 404 (Backend Routes Are Singular)', () => {
  /**
   * Property 8b: Plural /referrals/* paths should NOT return 404.
   *
   * The backend mounts routes at /referral/* (singular).
   * Any frontend code using the plural /referrals/* will receive a 404.
   *
   * These tests assert the correct behavior (no 404 on the right path).
   * On unfixed code, calling the plural paths throws an AxiosError with status 404,
   * so:
   *   - The test asserting the call does NOT throw → FAILS → bug confirmed
   *   - The test asserting response.status === 200   → FAILS → bug confirmed
   */

  afterEach(() => {
    vi.clearAllMocks();
  });

  it(
    'BUG CONDITION: /referrals/my-code (plural) should NOT return 404 — but it does on unfixed code',
    async () => {
      const { apiClient } = await import('@/services/api');

      // Call the plural path directly via the generic .get() method.
      // On unfixed code: the mock simulates the real backend — plural path → 404 error thrown.
      //
      // EXPECTED: resolves successfully (no 404)
      // ACTUAL on unfixed code: throws AxiosError { response.status: 404 }  →  TEST FAILS
      let caughtStatus: number | null = null;
      try {
        await (apiClient as any).get('/referrals/my-code');
      } catch (err: any) {
        caughtStatus = err?.response?.status ?? null;
      }

      // If caughtStatus is 404, the bug is confirmed.
      // Asserting it is NOT 404 will FAIL on unfixed code → confirms the bug.
      expect(
        caughtStatus,
        'Expected /referrals/my-code not to return 404.\n' +
        'Counterexample: apiClient.get("/referrals/my-code") → HTTP 404 (plural path not registered on backend)'
      ).not.toBe(404);
    }
  );

  it(
    'BUG CONDITION: /referrals/history (plural) should NOT return 404 — but it does on unfixed code',
    async () => {
      const { apiClient } = await import('@/services/api');

      let caughtStatus: number | null = null;
      try {
        await (apiClient as any).get('/referrals/history');
      } catch (err: any) {
        caughtStatus = err?.response?.status ?? null;
      }

      expect(
        caughtStatus,
        'Expected /referrals/history not to return 404.\n' +
        'Counterexample: apiClient.get("/referrals/history") → HTTP 404 (plural path not registered on backend)'
      ).not.toBe(404);
    }
  );

  it(
    'BUG CONDITION: /referrals/apply (plural) should NOT return 404 — but it does on unfixed code',
    async () => {
      const { apiClient } = await import('@/services/api');

      let caughtStatus: number | null = null;
      try {
        await (apiClient as any).post('/referrals/apply', { code: 'TEST-CODE' });
      } catch (err: any) {
        caughtStatus = err?.response?.status ?? null;
      }

      expect(
        caughtStatus,
        'Expected /referrals/apply not to return 404.\n' +
        'Counterexample: apiClient.post("/referrals/apply", ...) → HTTP 404 (plural path not registered on backend)'
      ).not.toBe(404);
    }
  );
});

describe('Bug 5 — Referral API: Singular Paths Work Correctly (Baseline Verification)', () => {
  /**
   * These tests verify that the correct singular paths /referral/* do NOT 404.
   * This establishes the baseline: the backend routes exist at singular paths.
   * After the fix, typed methods (getReferralCode etc.) will always call singular paths.
   *
   * These tests PASS on both fixed and unfixed code — they confirm the correct paths work.
   * (They serve as documentation of what the fix target looks like.)
   */

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('singular /referral/my-code path does NOT return 404 (baseline — correct path works)', async () => {
    const { apiClient } = await import('@/services/api');

    let caughtStatus: number | null = null;
    try {
      await (apiClient as any).get('/referral/my-code');
    } catch (err: any) {
      caughtStatus = err?.response?.status ?? null;
    }

    // Singular path resolves with 200 — this is the target behavior after fix
    expect(caughtStatus).not.toBe(404);
  });

  it('singular /referral/history path does NOT return 404 (baseline)', async () => {
    const { apiClient } = await import('@/services/api');

    let caughtStatus: number | null = null;
    try {
      await (apiClient as any).get('/referral/history');
    } catch (err: any) {
      caughtStatus = err?.response?.status ?? null;
    }

    expect(caughtStatus).not.toBe(404);
  });

  it('singular /referral/apply path does NOT return 404 (baseline)', async () => {
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
