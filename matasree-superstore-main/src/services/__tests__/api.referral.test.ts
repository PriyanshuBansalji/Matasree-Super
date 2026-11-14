/**
 * Unit Tests — Bug 5 Fix: Typed Referral Methods in ApiClient
 *
 * Task 19.5: Write unit tests for Bug 5 fix
 * Tests that the three new referral methods call the correct HTTP verb and path.
 *
 * Validates: Requirements 5.1, 5.2
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
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
  mockAxiosInstance.get.mockResolvedValue({ success: true, data: {} });
  mockAxiosInstance.post.mockResolvedValue({ success: true, data: {} });
});

afterEach(() => {
  vi.clearAllMocks();
});

const getApiClient = async () => {
  const mod = await import('@/services/api');
  return mod.apiClient;
};

describe('Bug 5 Fix — ApiClient Typed Referral Methods: Method Existence', () => {
  it('apiClient.getReferralCode is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.getReferralCode).toBe('function');
  });

  it('apiClient.applyReferralCode is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.applyReferralCode).toBe('function');
  });

  it('apiClient.getReferralHistory is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.getReferralHistory).toBe('function');
  });
});

describe('Bug 5 Fix — ApiClient Typed Referral Methods: Correct HTTP Verb and Path', () => {
  it('getReferralCode() → GET /referral/my-code', async () => {
    const apiClient = await getApiClient();
    await apiClient.getReferralCode();
    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/referral/my-code');
  });

  it('applyReferralCode("ABC") → POST /referral/apply with { code: "ABC" }', async () => {
    const apiClient = await getApiClient();
    await apiClient.applyReferralCode('ABC');
    expect(mockAxiosInstance.post).toHaveBeenCalledOnce();
    const [url, body] = mockAxiosInstance.post.mock.calls[0];
    expect(url).toBe('/referral/apply');
    expect(body).toEqual({ code: 'ABC' });
  });

  it('getReferralHistory() → GET /referral/history', async () => {
    const apiClient = await getApiClient();
    await apiClient.getReferralHistory();
    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/referral/history');
  });

  it('getReferralCode() path is NOT the plural /referrals/my-code', async () => {
    const apiClient = await getApiClient();
    await apiClient.getReferralCode();
    expect(mockAxiosInstance.get.mock.calls[0][0]).not.toBe('/referrals/my-code');
  });

  it('getReferralHistory() path is NOT the plural /referrals/history', async () => {
    const apiClient = await getApiClient();
    await apiClient.getReferralHistory();
    expect(mockAxiosInstance.get.mock.calls[0][0]).not.toBe('/referrals/history');
  });

  it('applyReferralCode() path is NOT the plural /referrals/apply', async () => {
    const apiClient = await getApiClient();
    await apiClient.applyReferralCode('TEST');
    expect(mockAxiosInstance.post.mock.calls[0][0]).not.toBe('/referrals/apply');
  });
});
