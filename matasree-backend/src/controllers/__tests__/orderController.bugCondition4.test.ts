/**
 * Bug Condition Exploration Test — Bug 4: COD Stock Race Condition
 *
 * PURPOSE (Approach B): Assert CORRECT behavior so the test FAILS on buggy (unfixed) code.
 *   - Two concurrent COD orders for a product with stock=1 should result in stock >= 0.
 *   - On unfixed code the test FAILS because the COD branch uses an unconditional
 *     `$inc: { stock: -qty }` with NO atomic `$gte` guard. Both orders pass the pre-check
 *     (which reads a snapshot), then both decrement, driving stock to -1.
 *
 * DOCUMENTED COUNTEREXAMPLE (from unfixed code):
 *   { stock: 1, concurrentRequests: 2, qty: 1 }
 *   → finalStock = -1 (race condition proven: both orders saw stock=1, both decremented)
 *   → Both responses returned HTTP 201 (both "succeeded" despite only 1 unit available)
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

/** Build a minimal authenticated request for a COD order */
function mockCODReq(userId: string) {
  return {
    body: {
      addressId: 'address-id-1',
      paymentMethod: 'cod',
    },
    user: { userId },
    headers: {},
    ip: '127.0.0.1',
    cookies: {},
  } as unknown as Request;
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('Bug 4: COD Stock Race Condition — Concurrent COD Orders Drive Stock Negative', () => {
  const PRODUCT_ID = 'product-id-1';
  const USER_ID_1 = 'user-id-1';
  const USER_ID_2 = 'user-id-2';

  /**
   * Shared stock counter — simulates the in-memory state of the DB document.
   * The unfixed COD branch calls `Product.findByIdAndUpdate(id, { $inc: { stock: -qty } })`
   * unconditionally, so both concurrent calls will decrement without any guard.
   */
  let stock: number;

  /**
   * Order ID counter — ensures each Order.create() call returns a unique ID so
   * multiple concurrent order creations don't collide.
   */
  let orderIdCounter: number;

  beforeEach(() => {
    stock = 1; // exactly 1 unit available
    orderIdCounter = 0;

    // ── Product mock ──────────────────────────────────────────────────────────
    //
    // Product.findById is called in the pre-check loop. Both concurrent requests
    // will see stock=1 at snapshot time — both pass the pre-check (this is the race).
    (Product.findById as jest.Mock).mockImplementation(async () => ({
      _id: PRODUCT_ID,
      name: 'Test Spice',
      stock: stock, // snapshot — both reads return 1
      price: 100,
    }));

    // Product.findByIdAndUpdate is called in the COD branch unconditionally.
    // This mock simulates the $inc without any atomic guard — stock goes negative.
    (Product.findByIdAndUpdate as jest.Mock).mockImplementation(async (_id: any, update: any) => {
      if (update.$inc?.stock !== undefined) {
        stock += update.$inc.stock; // adds -1 each time (no guard)
      }
      return { _id: PRODUCT_ID, name: 'Test Spice', stock };
    });

    // Product.findOneAndUpdate is used by the FIXED COD branch (atomic $gte guard).
    // Simulate the atomic conditional: first call decrements stock (returns product),
    // second call finds stock=0 and returns null (guard fails → rollback → 400).
    (Product.findOneAndUpdate as jest.Mock).mockImplementation(async (_filter: any, update: any, _opts: any) => {
      const qty = Math.abs(update?.$inc?.stock ?? 0);
      if (stock >= qty) {
        stock -= qty;
        return { _id: PRODUCT_ID, name: 'Test Spice', stock };
      }
      return null; // guard failed — concurrent request wins the last unit
    });

    // ── Cart mock ─────────────────────────────────────────────────────────────
    // Both users have identical carts: 1 item, qty=1, price=100
    const makeCartDoc = () => ({
      userId: USER_ID_1, // doesn't matter which — both have same items
      items: [
        {
          productId: {
            _id: PRODUCT_ID,
            name: 'Test Spice',
            price: 100,
            image: 'spice.jpg',
          },
          price: 100,
          quantity: 1,
        },
      ],
    });

    // Cart.findOne().populate() chain
    (Cart.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(makeCartDoc()),
    });

    // ── Address mock ──────────────────────────────────────────────────────────
    (Address.findById as jest.Mock).mockResolvedValue({
      _id: 'address-id-1',
      name: 'Test User',
      addressLine1: '123 Test St',
      city: 'Testville',
      state: 'TS',
      pincode: '123456',
      phone: '9999999999',
    });

    // ── Order mock ────────────────────────────────────────────────────────────
    // Each create() call returns a unique order document
    (Order.create as jest.Mock).mockImplementation(async (data: any) => {
      const id = `order-id-${++orderIdCounter}`;
      return {
        _id: id,
        orderNumber: data.orderNumber,
        items: data.items,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
      };
    });

    // Order.findByIdAndUpdate used for stockReservedAt — not relevant for COD
    (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    // Cart.findOneAndUpdate — clears cart after order
    (Cart.findOneAndUpdate as jest.Mock).mockResolvedValue({});

    // ── Payment mock ──────────────────────────────────────────────────────────
    (Payment.create as jest.Mock).mockResolvedValue({ _id: 'payment-id-1' });

    // ── User mock (for email sending) ─────────────────────────────────────────
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
    });
  });

  // ── Property 1: Bug Condition Test ─────────────────────────────────────────
  it(
    'Property 1 (Bug Condition): concurrent COD orders for stock=1 drive stock negative — ' +
    'FAILS on unfixed code because COD branch uses unconditional $inc with no $gte guard',
    async () => {
      // ── ARRANGE ────────────────────────────────────────────────────────────
      // stock=1, two concurrent COD requests, each requesting qty=1
      // Both will pass the pre-check (both read stock=1 snapshot)
      // Both will then call Product.findByIdAndUpdate with $inc: { stock: -1 }
      // On unfixed code: stock goes 1 → 0 → -1

      const req1 = mockCODReq(USER_ID_1);
      const res1 = mockRes();
      const req2 = mockCODReq(USER_ID_2);
      const res2 = mockRes();

      // ── ACT: Fire two concurrent COD orders ────────────────────────────────
      await Promise.all([
        createOrder(req1 as any, res1),
        createOrder(req2 as any, res2),
      ]);

      // ── ASSERT (correct behavior — FAILS on unfixed code) ─────────────────
      //
      // On UNFIXED code:
      //   - Both orders pass the pre-check (snapshot read of stock=1)
      //   - Both call Product.findByIdAndUpdate unconditionally
      //   - stock = 1 - 1 - 1 = -1  ← the race condition
      //   - Both responses return 201 (both "succeed" despite only 1 unit)
      //   → This assertion FAILS: expect(-1).toBeGreaterThanOrEqual(0)
      //
      // On FIXED code:
      //   - First order uses atomic $gte guard, succeeds, stock goes to 0
      //   - Second order's atomic update returns null (stock < qty), gets rolled back → 400
      //   - stock remains 0 or 1 (never negative)
      //   → This assertion PASSES: expect(0).toBeGreaterThanOrEqual(0)
      expect(stock).toBeGreaterThanOrEqual(0);

      // Also assert: at least one order should have been rejected (400)
      // On UNFIXED code: both return 201 (this FAILS too)
      // On FIXED code: one returns 201, one returns 400 (this PASSES)
      const statuses = [res1.statusCode, res2.statusCode];
      expect(statuses).toContain(400);
    }
  );

  // ── Documentation: counterexample shape ───────────────────────────────────
  it(
    'Documents the bug: both concurrent COD orders return 201 on unfixed code, ' +
    'proving neither was rejected despite stock=1',
    async () => {
      const req1 = mockCODReq(USER_ID_1);
      const res1 = mockRes();
      const req2 = mockCODReq(USER_ID_2);
      const res2 = mockRes();

      await Promise.all([
        createOrder(req1 as any, res1),
        createOrder(req2 as any, res2),
      ]);

      // On UNFIXED code: stock = -1 (race confirmed)
      // On FIXED code: stock = 0 (only one succeeded, one was rejected)
      const finalStock = stock;

      // This test is intentionally loose — it just documents what happened.
      // The key assertion (stock >= 0) is in Property 1 above.
      // Here we log the counterexample values for documentation.
      if (finalStock < 0) {
        // Bug confirmed: counterexample
        // { stock: 1, concurrentRequests: 2, qty: 1 } → finalStock = -1
        // res1.statusCode and res2.statusCode are both 201
        expect(finalStock).toBeLessThan(0); // This PASSES on buggy code (documents the bug)
      } else {
        // Fixed code path: one order succeeded, one rejected
        expect(finalStock).toBeGreaterThanOrEqual(0);
        const statuses = [res1.statusCode, res2.statusCode];
        expect(statuses).toContain(400);
        expect(statuses).toContain(201);
      }
    }
  );
});
