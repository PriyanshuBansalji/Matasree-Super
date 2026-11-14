/**
 * Integration Test — Bug 5 Fix: Referral API Canonical Routing
 *
 * Task 19.6: Write integration test for Bug 5 fix
 * Simulates authentication and then calling apiClient.getReferralCode(),
 * asserting HTTP 200 (not 404) by verifying the typed method uses the
 * correct singular /referral/my-code path.
 *
 * Validates: Requirements 5.1
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Simulate backend routing: only singular /referral/* paths get 200
const mockAxiosInstance = {
  get: vi.fn(async (url: string) => {
    if (url.includes('/referrals/')) {
      const err: any = new Error('404 Not Found');
      err.response = { status: 404, data: { message: 'Not Found' } };
      throw err;
    }
    if (url === '/referral/my-code') {
      return { success: true, data: { code: 'MATASREE-XYZ', usageCount: 3 } };
    }
    if (url === '/referral/history') {
      return { success: true, data: { referrals: [] } };
    }
    return { success: true, data: {} };
  }),
  post: vi.fn(async (url: string, body?: any) => {
    if (url.includes('/referrals/')) {
      const err: any = new Error('404 Not Found');
      err.response = { status: 404, data: { message: 'Not Found' } };
      throw err;
    }
    if (url === '/auth/login') {
      return { success: true, data: { accessToken: 'mock-token', user: { id: 'u1', name: 'Test' } } };
    }
    if (url === '/referral/apply') {
      return { success: true, data: { message: 'Referral applied' } };
    }
    return { success: true, data: {} };
  }),
  put: vi.fn(async () => ({ success: true, data: {} })),
  delete: vi.fn(async () => ({ success: true, data: {} })),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
  defaults: {
    baseURL: 'http://localhost:5001/api',
    headers: { common: {} as Record<string, string> },
  },
};

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  const create = vi.fn(() => mockAxiosInstance);
  return {
    default: { ...actual.default, create },
    create,
    post: vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Bug 5 Fix — Integration: Referral API Canonical Routing (No 404)', () => {
  it('getReferralCode() resolves successfully — hits /referral/my-code, not 404', async () => {
    const { apiClient } = await import('@/services/api');

    let result: any = null;
    let thrownError: any = null;

    try {
      result = await apiClient.getReferralCode();
    } catch (err) {
      thrownError = err;
    }

    // Must NOT have thrown (no 404)
    expect(thrownError).toBeNull();
    // Verify the path used was /referral/my-code (singular)
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/referral/my-code');
    // Response should contain code data
    expect(result).toHaveProperty('data');
  });

  it('getReferralHistory() resolves successfully — hits /referral/history, not 404', async () => {
    const { apiClient } = await import('@/services/api');

    let thrownError: any = null;

    try {
      await apiClient.getReferralHistory();
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeNull();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/referral/history');
  });

  it('applyReferralCode("FRIEND10") resolves successfully — hits /referral/apply, not 404', async () => {
    const { apiClient } = await import('@/services/api');

    let thrownError: any = null;

    try {
      await apiClient.applyReferralCode('FRIEND10');
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeNull();
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/referral/apply', { code: 'FRIEND10' });
  });

  it('full flow: login then getReferralCode — no 404 on canonical path', async () => {
    const { apiClient } = await import('@/services/api');

    // Step 1: Simulate login
    const loginResponse = await apiClient.login({ email: 'user@test.com', password: 'pass' });
    expect(loginResponse).toBeDefined();

    // Step 2: Call getReferralCode — must resolve, not 404
    let thrownError: any = null;
    let codeResponse: any = null;
    try {
      codeResponse = await apiClient.getReferralCode();
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeNull();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/referral/my-code');
    // Verify response data structure
    expect(codeResponse).toHaveProperty('data');
    expect((codeResponse as any).data).toHaveProperty('code');
  });
});
