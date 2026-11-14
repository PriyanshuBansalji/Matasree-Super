/**
 * Preservation Property Tests — Bug 5: Referral API
 *
 * Task 18: Write preservation property tests — Referral API (BEFORE implementing fix)
 * Property 2: Preservation — Existing ApiClient Methods Unchanged; Non-Referral Routes Unaffected
 *
 * **Validates: Requirements Unchanged Behavior 5**
 *
 * OBSERVATION-FIRST METHODOLOGY:
 *   - Observe: all existing ApiClient methods (login, register, getProducts, etc.)
 *     return expected results on UNFIXED code
 *   - Observe: non-referral routes respond correctly (no collateral damage)
 *   - Observe: apiClient does NOT have getReferralCode / applyReferralCode / getReferralHistory
 *     on unfixed code — this is the expected baseline BEFORE the fix
 *
 * EXPECTED OUTCOME: All tests PASS on UNFIXED code.
 * These tests must continue to pass after the fix in Task 19 is applied.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ─── Mock axios BEFORE importing apiClient ───────────────────────────────────
// ApiClient calls axios.create() in its constructor, so the mock must be
// in place before the module is first imported.

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a resolved mock response mimicking the ApiClient's response interceptor (returns response.data). */
const ok = (data: unknown = {}) => Promise.resolve(data);

// ─── Reset mocks between tests ────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAxiosInstance.get.mockResolvedValue({ success: true, data: {} });
  mockAxiosInstance.post.mockResolvedValue({ success: true, data: {} });
  mockAxiosInstance.put.mockResolvedValue({ success: true, data: {} });
  mockAxiosInstance.delete.mockResolvedValue({ success: true, data: {} });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── Shared import (resolved after mock is in place) ─────────────────────────

const getApiClient = async () => {
  const mod = await import('@/services/api');
  return mod.apiClient;
};

// =============================================================================
// Suite 1 — Method Existence (structural preservation)
// =============================================================================

describe('Preservation 5 — ApiClient: Existing Methods Exist and Are Functions', () => {
  /**
   * Verifies that the key typed methods on ApiClient are present
   * (i.e. have not been accidentally deleted or renamed by a patch).
   *
   * These assertions PASS on UNFIXED code and must continue to PASS after the fix.
   */

  it('auth: login is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.login).toBe('function');
  });

  it('auth: register is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.register).toBe('function');
  });

  it('auth: logout is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.logout).toBe('function');
  });

  it('auth: getProfile is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.getProfile).toBe('function');
  });

  it('auth: updateProfile is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.updateProfile).toBe('function');
  });

  it('products: getProducts is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.getProducts).toBe('function');
  });

  it('products: getProductById is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.getProductById).toBe('function');
  });

  it('cart: getCart is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.getCart).toBe('function');
  });

  it('cart: addToCart is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.addToCart).toBe('function');
  });

  it('orders: getOrders is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.getOrders).toBe('function');
  });

  it('orders: getOrderById is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.getOrderById).toBe('function');
  });

  it('wishlist: getWishlist is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.getWishlist).toBe('function');
  });

  it('wishlist: addToWishlist is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.addToWishlist).toBe('function');
  });

  it('coupon: validateCoupon is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.validateCoupon).toBe('function');
  });

  it('coupon: applyCoupon is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.applyCoupon).toBe('function');
  });

  it('address: getAddresses is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.getAddresses).toBe('function');
  });

  it('address: addAddress is a function', async () => {
    const apiClient = await getApiClient();
    expect(typeof apiClient.addAddress).toBe('function');
  });
});

// =============================================================================
// Suite 2 — Correct HTTP Verb + Path (behavioral preservation)
// =============================================================================

describe('Preservation 5 — ApiClient: Existing Methods Use Correct HTTP Verb and Path', () => {
  /**
   * For each sampled method, verifies:
   *   1. The correct underlying mock (get/post/put/delete) is called
   *   2. The exact URL path matches the spec
   *   3. Any parameters / body are forwarded correctly
   *
   * All assertions PASS on UNFIXED code and must continue to PASS after the fix.
   */

  // ── Auth ──────────────────────────────────────────────────────────────────

  it('auth: login → POST /auth/login with credentials', async () => {
    const apiClient = await getApiClient();
    const creds = { email: 'user@example.com', password: 'secret123' };
    await apiClient.login(creds);

    expect(mockAxiosInstance.post).toHaveBeenCalledOnce();
    const [url, body] = mockAxiosInstance.post.mock.calls[0];
    expect(url).toBe('/auth/login');
    expect(body).toEqual(creds);
  });

  it('auth: register → POST /auth/register with user data', async () => {
    const apiClient = await getApiClient();
    const data = { name: 'Alice', email: 'alice@example.com', password: 'pw123' };
    await apiClient.register(data);

    expect(mockAxiosInstance.post).toHaveBeenCalledOnce();
    const [url, body] = mockAxiosInstance.post.mock.calls[0];
    expect(url).toBe('/auth/register');
    expect(body).toEqual(data);
  });

  it('auth: logout → POST /auth/logout', async () => {
    const apiClient = await getApiClient();
    await apiClient.logout();

    expect(mockAxiosInstance.post).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.post.mock.calls[0][0]).toBe('/auth/logout');
  });

  it('auth: getProfile → GET /auth/profile', async () => {
    const apiClient = await getApiClient();
    await apiClient.getProfile();

    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/auth/profile');
  });

  it('auth: updateProfile → PUT /auth/profile with data', async () => {
    const apiClient = await getApiClient();
    const data = { name: 'Bob', phone: '555-0100' };
    await apiClient.updateProfile(data);

    expect(mockAxiosInstance.put).toHaveBeenCalledOnce();
    const [url, body] = mockAxiosInstance.put.mock.calls[0];
    expect(url).toBe('/auth/profile');
    expect(body).toEqual(data);
  });

  // ── Products ──────────────────────────────────────────────────────────────

  it('products: getProducts → GET /products', async () => {
    const apiClient = await getApiClient();
    await apiClient.getProducts();

    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/products');
  });

  it('products: getProducts passes params correctly', async () => {
    const apiClient = await getApiClient();
    const params = { page: 2, limit: 10 };
    await apiClient.getProducts(params);

    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    const [url, config] = mockAxiosInstance.get.mock.calls[0];
    expect(url).toBe('/products');
    expect(config).toEqual({ params });
  });

  it('products: getProductById → GET /products/:id', async () => {
    const apiClient = await getApiClient();
    await apiClient.getProductById('prod-abc');

    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/products/prod-abc');
  });

  // ── Cart ──────────────────────────────────────────────────────────────────

  it('cart: getCart → GET /cart', async () => {
    const apiClient = await getApiClient();
    await apiClient.getCart();

    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/cart');
  });

  it('cart: addToCart → POST /cart/add with productId and quantity', async () => {
    const apiClient = await getApiClient();
    const payload = { productId: 'prod-xyz', quantity: 3 };
    await apiClient.addToCart(payload);

    expect(mockAxiosInstance.post).toHaveBeenCalledOnce();
    const [url, body] = mockAxiosInstance.post.mock.calls[0];
    expect(url).toBe('/cart/add');
    expect(body).toEqual(payload);
  });

  it('cart: removeFromCart → POST /cart/remove with productId', async () => {
    const apiClient = await getApiClient();
    await apiClient.removeFromCart('prod-xyz');

    expect(mockAxiosInstance.post).toHaveBeenCalledOnce();
    const [url, body] = mockAxiosInstance.post.mock.calls[0];
    expect(url).toBe('/cart/remove');
    expect(body).toEqual({ productId: 'prod-xyz' });
  });

  // ── Orders ────────────────────────────────────────────────────────────────

  it('orders: getOrders → GET /orders/my-orders', async () => {
    const apiClient = await getApiClient();
    await apiClient.getOrders();

    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/orders/my-orders');
  });

  it('orders: getOrderById → GET /orders/:id', async () => {
    const apiClient = await getApiClient();
    await apiClient.getOrderById('order-123');

    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/orders/order-123');
  });

  it('orders: cancelOrder → PUT /orders/:id/cancel', async () => {
    const apiClient = await getApiClient();
    await apiClient.cancelOrder('order-456');

    expect(mockAxiosInstance.put).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.put.mock.calls[0][0]).toBe('/orders/order-456/cancel');
  });

  // ── Wishlist ──────────────────────────────────────────────────────────────

  it('wishlist: getWishlist → GET /wishlist', async () => {
    const apiClient = await getApiClient();
    await apiClient.getWishlist();

    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/wishlist');
  });

  it('wishlist: addToWishlist → POST /wishlist/:productId', async () => {
    const apiClient = await getApiClient();
    await apiClient.addToWishlist('prod-999');

    expect(mockAxiosInstance.post).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.post.mock.calls[0][0]).toBe('/wishlist/prod-999');
  });

  it('wishlist: removeFromWishlist → DELETE /wishlist/:productId', async () => {
    const apiClient = await getApiClient();
    await apiClient.removeFromWishlist('prod-999');

    expect(mockAxiosInstance.delete).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.delete.mock.calls[0][0]).toBe('/wishlist/prod-999');
  });

  // ── Coupon ────────────────────────────────────────────────────────────────

  it('coupon: validateCoupon → POST /coupons/validate with code and orderAmount', async () => {
    const apiClient = await getApiClient();
    await apiClient.validateCoupon('SAVE10', 500);

    expect(mockAxiosInstance.post).toHaveBeenCalledOnce();
    const [url, body] = mockAxiosInstance.post.mock.calls[0];
    expect(url).toBe('/coupons/validate');
    expect(body).toEqual({ code: 'SAVE10', orderAmount: 500 });
  });

  it('coupon: applyCoupon → POST /coupons/apply with code, orderId, and orderAmount', async () => {
    const apiClient = await getApiClient();
    await apiClient.applyCoupon('SAVE10', 'order-789', 500);

    expect(mockAxiosInstance.post).toHaveBeenCalledOnce();
    const [url, body] = mockAxiosInstance.post.mock.calls[0];
    expect(url).toBe('/coupons/apply');
    expect(body).toEqual({ code: 'SAVE10', orderId: 'order-789', orderAmount: 500 });
  });

  // ── Address ───────────────────────────────────────────────────────────────

  it('address: getAddresses → GET /addresses', async () => {
    const apiClient = await getApiClient();
    await apiClient.getAddresses();

    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/addresses');
  });

  it('address: addAddress → POST /addresses with data', async () => {
    const apiClient = await getApiClient();
    const addr = { street: '123 Main St', city: 'Mumbai', pincode: '400001' };
    await apiClient.addAddress(addr);

    expect(mockAxiosInstance.post).toHaveBeenCalledOnce();
    const [url, body] = mockAxiosInstance.post.mock.calls[0];
    expect(url).toBe('/addresses');
    expect(body).toEqual(addr);
  });

  it('address: updateAddress → PUT /addresses/:id with data', async () => {
    const apiClient = await getApiClient();
    const addr = { city: 'Delhi' };
    await apiClient.updateAddress('addr-1', addr);

    expect(mockAxiosInstance.put).toHaveBeenCalledOnce();
    const [url, body] = mockAxiosInstance.put.mock.calls[0];
    expect(url).toBe('/addresses/addr-1');
    expect(body).toEqual(addr);
  });

  it('address: deleteAddress → DELETE /addresses/:id', async () => {
    const apiClient = await getApiClient();
    await apiClient.deleteAddress('addr-2');

    expect(mockAxiosInstance.delete).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.delete.mock.calls[0][0]).toBe('/addresses/addr-2');
  });

  it('address: setDefaultAddress → POST /addresses/:id/set-default', async () => {
    const apiClient = await getApiClient();
    await apiClient.setDefaultAddress('addr-3');

    expect(mockAxiosInstance.post).toHaveBeenCalledOnce();
    expect(mockAxiosInstance.post.mock.calls[0][0]).toBe('/addresses/addr-3/set-default');
  });
});

// =============================================================================
// Suite 3 — Referral Methods Present After Fix (verification)
// =============================================================================

describe('Preservation 5 — ApiClient: Referral Methods Present After Fix (verification)', () => {
  /**
   * After Task 19 is applied, getReferralCode, applyReferralCode, and getReferralHistory
   * are NOW PRESENT on ApiClient. These tests verify the fix: the three typed methods
   * exist and are callable functions.
   *
   * EXPECTED: all three assertions PASS (methods are functions on fixed code).
   * This suite was updated from the baseline (which asserted methods were undefined)
   * to reflect the fixed state after Bug 5 resolution.
   */

  it('fixed state: apiClient.getReferralCode IS a function (method added by Bug 5 fix)', async () => {
    const apiClient = await getApiClient();
    // After Task 19: method exists and is callable
    expect(typeof (apiClient as any).getReferralCode).toBe('function');
  });

  it('fixed state: apiClient.applyReferralCode IS a function (method added by Bug 5 fix)', async () => {
    const apiClient = await getApiClient();
    expect(typeof (apiClient as any).applyReferralCode).toBe('function');
  });

  it('fixed state: apiClient.getReferralHistory IS a function (method added by Bug 5 fix)', async () => {
    const apiClient = await getApiClient();
    expect(typeof (apiClient as any).getReferralHistory).toBe('function');
  });
});

// =============================================================================
// Suite 4 — No Collateral Damage to Non-Referral Routes
// =============================================================================

describe('Preservation 5 — ApiClient: Non-Referral Route Methods Unaffected', () => {
  /**
   * Verifies that a sample of non-referral methods spanning different
   * domains all make requests to paths that do NOT start with /referral.
   * This confirms no route collateral damage from the upcoming fix.
   *
   * PASSES on both UNFIXED and FIXED code.
   */

  it('getLoyaltyBalance → path is /loyalty/balance (not /referral/*)', async () => {
    const apiClient = await getApiClient();
    await apiClient.getLoyaltyBalance();

    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    const [url] = mockAxiosInstance.get.mock.calls[0];
    expect(url).toBe('/loyalty/balance');
    expect(url).not.toMatch(/\/referral/);
  });

  it('getCategories → path is /categories (not /referral/*)', async () => {
    const apiClient = await getApiClient();
    await apiClient.getCategories();

    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    const [url] = mockAxiosInstance.get.mock.calls[0];
    expect(url).toBe('/categories');
    expect(url).not.toMatch(/\/referral/);
  });

  it('submitReview → path is /reviews/submit (not /referral/*)', async () => {
    const apiClient = await getApiClient();
    const review = { name: 'Alice', rating: 5, comment: 'Great product!' };
    await apiClient.submitReview(review);

    expect(mockAxiosInstance.post).toHaveBeenCalledOnce();
    const [url] = mockAxiosInstance.post.mock.calls[0];
    expect(url).toBe('/reviews/submit');
    expect(url).not.toMatch(/\/referral/);
  });

  it('getAdminStats → path is /admin/stats (not /referral/*)', async () => {
    const apiClient = await getApiClient();
    await apiClient.getAdminStats();

    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    const [url] = mockAxiosInstance.get.mock.calls[0];
    expect(url).toBe('/admin/stats');
    expect(url).not.toMatch(/\/referral/);
  });

  it('getWishlist → path is /wishlist (not /referral/*)', async () => {
    const apiClient = await getApiClient();
    await apiClient.getWishlist();

    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    const [url] = mockAxiosInstance.get.mock.calls[0];
    expect(url).toBe('/wishlist');
    expect(url).not.toMatch(/\/referral/);
  });
});
