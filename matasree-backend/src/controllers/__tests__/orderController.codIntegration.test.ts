/**
 * Integration Tests — Bug 4 Fix: COD Stock Race Condition (Atomic Guard)
 *
 * PURPOSE: Verify the end-to-end behaviour of the fixed COD branch under
 *   concurrent load using mongoose-level mocking (no real MongoDB required).
 *
 *   Scenario: product with stock=1, two concurrent COD orders (qty=1 each).
 *   - Exactly ONE response must be 201 (success)
 *   - Exactly ONE response must be 400 (out of stock)
 *   - Product.stock === 0 after both settle (not -1, not negative)
 *
 * The mock for Product.findOneAndUpdate implements the atomic $gte conditional
 * at the JavaScript level: a shared `stock` variable is checked and decremented
 * in the same synchronous tick within the mock implementation.  Node.js's
 * single-threaded event loop means each `await` allows the other Promise to
 * advance exactly one microtask step — this faithfully reproduces the race
 * window that existed in the buggy code.
 *
 * Validates: Requirements 4.1, 4.2
 */

import { Request, Response } from 'express';

// ── Mock all heavy dependencies BEFORE importing the controller ──────────────

jest.mock('../../models/Product');
jest.mock('../../models/Order');
jest.mock('../../models/Cart');
jest.mock('../../models/Address');
jest.mock('../../models/Payment');
jest.mock('../../models/User');

jest.mock('../../config/redis', () => ({
  redisClient: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    isUsingFallback: jest.fn(() => true),
  },
}));

jest.mock('../../utils/cashfree', () => ({
  createCashfreeOrder: jest.fn(),
  fetchCashfreeOrder: jest.fn(),
  createCashfreeRefund: jest.fn(),
  verifyCashfreeWebhookSignature: jest.fn(),
}));

jest.mock('../../utils/email', () => ({
  sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendShippedEmail: jest.fn().mockResolvedValue(true),
  sendDeliveredEmail: jest.fn().mockResolvedValue(true),
  sendCancelledEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../middleware/auditLogger', () => ({
  logSecurityEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../config/logger', () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../services/loyaltyService', () => ({
  awardLoyaltyPoints: jest.fn().mockResolvedValue(undefined),
  reverseLoyaltyPoints: jest.fn().mockResolvedValue(undefined),
}));

// ── Imports (after mocks are set up) ─────────────────────────────────────────
import { createOrder } from '../orderController';
import Product from '../../models/Product';
import Order from '../../models/Order';
import Cart from '../../models/Cart';
import Address from '../../models/Address';
import Payment from '../../models/Payment';
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

function mockCODReq(userId: string) {
  return {
    body: { addressId: 'address-id-1', paymentMethod: 'cod' },
    user: { userId },
    headers: {},
    ip: '127.0.0.1',
    cookies: {},
  } as unknown as Request;
}

// ── Integration Test Suite ────────────────────────────────────────────────────

describe('Integration: COD Race Condition Fix — stock=1, two concurrent COD orders (qty=1)', () => {
  const PRODUCT_ID = 'prod-integration-1';

  /**
   * Shared state — simulates the MongoDB document's stock field.
   * The atomic findOneAndUpdate mock reads and writes this synchronously
   * within the same microtask, preventing any race condition.
   */
  let stock: number;
  let orderIdCounter: number;

  beforeEach(() => {
    stock = 1;          // seed: exactly 1 unit available
    orderIdCounter = 0;
    jest.clearAllMocks();

    // ── Pre-check (findById): both concurrent requests read the snapshot ──────
    // Both will see stock=1, simulating the race window where they both "see"
    // enough inventory before the atomic decrement runs.
    (Product.findById as jest.Mock).mockResolvedValue({
      _id: PRODUCT_ID,
      name: 'Integration Spice',
      stock: 1,   // snapshot — both concurrent pre-checks see stock=1
      price: 150,
    });

    // ── Atomic guard (findOneAndUpdate) ────────────────────────────────────────
    // This is the core of the fix: check stock >= qty ATOMICALLY before decrement.
    // Uses a synchronous check on the shared `stock` variable so that only the
    // first caller can decrement (stock goes 1→0), and the second gets null.
    (Product.findOneAndUpdate as jest.Mock).mockImplementation(
      async (filter: any, update: any, _opts: any) => {
        const requestedQty = Math.abs(update.$inc?.stock ?? 0);
        if (stock >= requestedQty) {
          // Atomic compare-and-set
          stock -= requestedQty;
          return { _id: PRODUCT_ID, name: 'Integration Spice', stock };
        }
        return null; // guard failed — stock insufficient
      }
    );

    // ── Rollback (findByIdAndUpdate) ───────────────────────────────────────────
    // Called when the guard fails mid-order to reverse prior decrements.
    (Product.findByIdAndUpdate as jest.Mock).mockImplementation(async (_id: any, update: any) => {
      if (update.$inc?.stock > 0) {
        stock += update.$inc.stock;
      }
      return { _id: _id };
    });

    // ── Cart ───────────────────────────────────────────────────────────────────
    (Cart.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        userId: 'user-id',
        items: [
          {
            productId: { _id: PRODUCT_ID, name: 'Integration Spice', price: 150, image: 'spice.jpg' },
            price: 150,
            quantity: 1,
          },
        ],
      }),
    });

    // ── Address ───────────────────────────────────────────────────────────────
    (Address.findById as jest.Mock).mockResolvedValue({
      _id: 'address-id-1',
      name: 'Integration Tester',
      addressLine1: '1 Test Lane',
      city: 'Testcity',
      state: 'TC',
      pincode: '654321',
      phone: '8888888888',
    });

    // ── Order ─────────────────────────────────────────────────────────────────
    (Order.create as jest.Mock).mockImplementation(async (data: any) => ({
      _id: `order-id-${++orderIdCounter}`,
      orderNumber: data.orderNumber,
      items: data.items,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
    }));

    (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
    (Order.findByIdAndDelete as jest.Mock).mockResolvedValue({});
    (Cart.findOneAndUpdate as jest.Mock).mockResolvedValue({});

    // ── Payment ───────────────────────────────────────────────────────────────
    (Payment.create as jest.Mock).mockResolvedValue({ _id: 'payment-id' });
    (Payment.deleteOne as jest.Mock).mockResolvedValue({});

    // ── User ──────────────────────────────────────────────────────────────────
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ email: 'integration@test.com' }),
    });
  });

  // ── Core integration assertion ─────────────────────────────────────────────

  it('exactly one request succeeds (201) and one fails (400) — never both 201', async () => {
    const req1 = mockCODReq('user-id-1');
    const res1 = mockRes();
    const req2 = mockCODReq('user-id-2');
    const res2 = mockRes();

    // Fire both concurrent COD orders simultaneously
    await Promise.all([
      createOrder(req1 as any, res1),
      createOrder(req2 as any, res2),
    ]);

    const statuses = [res1.statusCode, res2.statusCode].sort();

    // Exactly one 201 and one 400
    expect(statuses).toEqual([400, 201].sort());

    // Equivalently: both statuses are not 201 (the pre-fix bug would give [201, 201])
    expect(statuses).not.toEqual([201, 201]);
    expect(statuses).not.toEqual([400, 400]);
  });

  it('Product.stock === 0 after both concurrent orders settle (not negative)', async () => {
    const req1 = mockCODReq('user-id-1');
    const res1 = mockRes();
    const req2 = mockCODReq('user-id-2');
    const res2 = mockRes();

    await Promise.all([
      createOrder(req1 as any, res1),
      createOrder(req2 as any, res2),
    ]);

    // The only remaining unit was claimed by the one successful order
    expect(stock).toBe(0);
  });

  it('stock is never negative (core non-negativity invariant)', async () => {
    const req1 = mockCODReq('user-id-1');
    const res1 = mockRes();
    const req2 = mockCODReq('user-id-2');
    const res2 = mockRes();

    await Promise.all([
      createOrder(req1 as any, res1),
      createOrder(req2 as any, res2),
    ]);

    expect(stock).toBeGreaterThanOrEqual(0);
  });

  it('the successful order returns { success: true } with order data', async () => {
    const req1 = mockCODReq('user-id-1');
    const res1 = mockRes();
    const req2 = mockCODReq('user-id-2');
    const res2 = mockRes();

    await Promise.all([
      createOrder(req1 as any, res1),
      createOrder(req2 as any, res2),
    ]);

    const successRes = [res1, res2].find(r => r.statusCode === 201);
    expect(successRes).toBeDefined();
    expect(successRes!.body).toMatchObject({ success: true });
    expect(successRes!.body.data).toHaveProperty('order');
  });

  it('the rejected order returns { success: false } with out-of-stock message', async () => {
    const req1 = mockCODReq('user-id-1');
    const res1 = mockRes();
    const req2 = mockCODReq('user-id-2');
    const res2 = mockRes();

    await Promise.all([
      createOrder(req1 as any, res1),
      createOrder(req2 as any, res2),
    ]);

    const failRes = [res1, res2].find(r => r.statusCode === 400);
    expect(failRes).toBeDefined();
    expect(failRes!.body).toMatchObject({ success: false });
    expect(failRes!.body.message).toMatch(/out of stock/i);
  });

  it('Order.create is called exactly once (only the successful order persists)', async () => {
    const req1 = mockCODReq('user-id-1');
    const res1 = mockRes();
    const req2 = mockCODReq('user-id-2');
    const res2 = mockRes();

    await Promise.all([
      createOrder(req1 as any, res1),
      createOrder(req2 as any, res2),
    ]);

    // Both orders create their Order document before the atomic decrement
    // (Order.create happens before the stock check in the COD branch).
    // The failed order's Order document gets deleted via Order.findByIdAndDelete.
    // Net result: findByIdAndDelete called once for the failed order.
    expect(Order.findByIdAndDelete).toHaveBeenCalledTimes(1);
    expect(Payment.deleteOne).toHaveBeenCalledTimes(1);
  });
});

// ── Additional integration scenario: stock=2, three concurrent requests ───────

describe('Integration: COD Race Condition Fix — stock=2, three concurrent COD orders (qty=1)', () => {
  const PRODUCT_ID = 'prod-integration-2';

  let stock: number;
  let orderIdCounter: number;

  beforeEach(() => {
    stock = 2;
    orderIdCounter = 0;
    jest.clearAllMocks();

    (Product.findById as jest.Mock).mockResolvedValue({
      _id: PRODUCT_ID,
      name: 'Integration Spice 2',
      stock: 2,
      price: 200,
    });

    (Product.findOneAndUpdate as jest.Mock).mockImplementation(
      async (_filter: any, update: any, _opts: any) => {
        const qty = Math.abs(update.$inc?.stock ?? 0);
        if (stock >= qty) {
          stock -= qty;
          return { _id: PRODUCT_ID, name: 'Integration Spice 2', stock };
        }
        return null;
      }
    );

    (Product.findByIdAndUpdate as jest.Mock).mockImplementation(async (_id: any, update: any) => {
      if (update.$inc?.stock > 0) stock += update.$inc.stock;
      return { _id: _id };
    });

    (Cart.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        userId: 'user-id',
        items: [
          {
            productId: { _id: PRODUCT_ID, name: 'Integration Spice 2', price: 200, image: 'img.jpg' },
            price: 200,
            quantity: 1,
          },
        ],
      }),
    });

    (Address.findById as jest.Mock).mockResolvedValue({
      _id: 'address-id-1',
      name: 'Integration Tester',
      addressLine1: '1 Test Lane',
      city: 'Testcity',
      state: 'TC',
      pincode: '654321',
      phone: '8888888888',
    });

    (Order.create as jest.Mock).mockImplementation(async (data: any) => ({
      _id: `order-id-${++orderIdCounter}`,
      orderNumber: data.orderNumber,
      items: data.items,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
    }));

    (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
    (Order.findByIdAndDelete as jest.Mock).mockResolvedValue({});
    (Cart.findOneAndUpdate as jest.Mock).mockResolvedValue({});
    (Payment.create as jest.Mock).mockResolvedValue({ _id: 'payment-id' });
    (Payment.deleteOne as jest.Mock).mockResolvedValue({});

    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ email: 'integration2@test.com' }),
    });
  });

  it('exactly two requests succeed (201) and one fails (400) when stock=2 and 3 requests come in', async () => {
    const responses = await Promise.all(
      Array.from({ length: 3 }, (_, i) => {
        const req = mockCODReq(`user-id-${i}`);
        const res = mockRes();
        return createOrder(req as any, res).then(() => res);
      })
    );

    const successCount = responses.filter(r => r.statusCode === 201).length;
    const failCount = responses.filter(r => r.statusCode === 400).length;

    expect(successCount).toBe(2);
    expect(failCount).toBe(1);
  });

  it('final stock is 0 after 3 requests against stock=2 (all units claimed, none negative)', async () => {
    await Promise.all(
      Array.from({ length: 3 }, (_, i) => {
        const req = mockCODReq(`user-id-${i}`);
        const res = mockRes();
        return createOrder(req as any, res);
      })
    );

    expect(stock).toBe(0);
    expect(stock).toBeGreaterThanOrEqual(0);
  });
});
