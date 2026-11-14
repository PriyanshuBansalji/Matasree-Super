/**
 * Preservation Property Tests — Bug 4: COD Stock Race Condition (BEFORE implementing fix)
 *
 * PURPOSE: Confirm the NON-BUGGY baselines that the fix must preserve.
 *   These tests verify behaviors that work correctly on UNFIXED code and MUST
 *   continue to work exactly the same way after the COD atomic guard fix is applied.
 *
 * Tests must ALL PASS on the UNFIXED orderController.ts.
 *
 * Property 2: Preservation — Single COD Order With Sufficient Stock Succeeds;
 *   Razorpay Branch Atomic Conditional Decrement Is Unchanged.
 *
 * Tests:
 *   Test 1 — Single COD order with sufficient stock (qty < stock) succeeds → HTTP 201,
 *             finalStock = initialStock - requestedQty, Order and Payment created in DB.
 *   Test 2 — Razorpay branch atomic decrement baseline: single Razorpay order with
 *             sufficient stock succeeds → HTTP 201, stock decremented atomically via $gte guard.
 *   Test 3 — COD boundary case: requestedQty === availableStock succeeds → finalStock === 0.
 *   Test 4 — COD pre-check: requestedQty > availableStock returns 400, stock unchanged.
 *
 * EXPECTED OUTCOME: All tests PASS on UNFIXED code.
 *
 * Validates: Unchanged Behavior 4 (Requirements 4.3, 4.4)
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
  createCashfreeOrder: jest.fn().mockResolvedValue({
    order_id: 'cashfree-order-id-1',
    payment_session_id: 'session-123',
    order_amount: 100,
    order_currency: 'INR',
  }),
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
import { createCashfreeOrder } from '../../utils/cashfree';

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

/** Build a minimal authenticated request for a Razorpay order */
function mockCashfreeReq(userId: string) {
  return {
    body: {
      addressId: 'address-id-1',
      paymentMethod: 'cashfree',
    },
    user: { userId },
    headers: {},
    ip: '127.0.0.1',
    cookies: {},
  } as unknown as Request;
}

/** Standard address doc used across tests */
const STANDARD_ADDRESS = {
  _id: 'address-id-1',
  name: 'Test User',
  addressLine1: '123 Test St',
  city: 'Testville',
  state: 'TS',
  pincode: '123456',
  phone: '9999999999',
};

const PRODUCT_ID = 'product-id-1';

let orderIdCounter = 0;

/** Set up the standard shared mocks used by most tests */
function setupCommonMocks({
  initialStock,
  requestedQty,
  price = 100,
}: {
  initialStock: number;
  requestedQty: number;
  price?: number;
}): { getStock: () => number } {
  let stock = initialStock;

  // Product.findById — called by the pre-check loop
  (Product.findById as jest.Mock).mockImplementation(async () => ({
    _id: PRODUCT_ID,
    name: 'Test Spice',
    stock: stock,
    price,
  }));

  // Product.findByIdAndUpdate — called by the UNFIXED COD branch ($inc unconditional)
  (Product.findByIdAndUpdate as jest.Mock).mockImplementation(async (_id: any, update: any) => {
    if (update.$inc?.stock !== undefined) {
      stock += update.$inc.stock;
    }
    return { _id: PRODUCT_ID, name: 'Test Spice', stock };
  });

  // Product.findOneAndUpdate — called by the Razorpay branch (atomic $gte guard)
  (Product.findOneAndUpdate as jest.Mock).mockImplementation(
    async (_filter: any, update: any, _opts: any) => {
      // Simulate the atomic $gte guard: only update if stock >= requested qty
      if (stock >= requestedQty) {
        if (update.$inc?.stock !== undefined) {
          stock += update.$inc.stock;
        }
        return { _id: PRODUCT_ID, name: 'Test Spice', stock };
      }
      return null; // guard failed — stock insufficient
    }
  );

  // Cart mock — single item with the specified qty and price
  (Cart.findOne as jest.Mock).mockReturnValue({
    populate: jest.fn().mockResolvedValue({
      userId: 'user-id-1',
      items: [
        {
          productId: {
            _id: PRODUCT_ID,
            name: 'Test Spice',
            price,
            image: 'spice.jpg',
          },
          price,
          quantity: requestedQty,
        },
      ],
    }),
  });

  // Address mock
  (Address.findById as jest.Mock).mockResolvedValue(STANDARD_ADDRESS);

  // Order mock — each create returns a unique ID
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

  (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
  (Cart.findOneAndUpdate as jest.Mock).mockResolvedValue({});
  (Payment.create as jest.Mock).mockResolvedValue({ _id: 'payment-id-1' });

  (User.findById as jest.Mock).mockReturnValue({
    select: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
  });

  return { getStock: () => stock };
}

// ── Test Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  orderIdCounter = 0;
  jest.clearAllMocks();

  // Re-apply the createRazorpayOrder mock after clearAllMocks (clearMocks resets implementations)
  (createCashfreeOrder as jest.Mock).mockResolvedValue({
    order_id: 'cashfree-order-id-1',
    payment_session_id: 'session-123',
    order_amount: 100,
    order_currency: 'INR',
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Test 1 — Single COD order with sufficient stock succeeds
// ═════════════════════════════════════════════════════════════════════════════

describe('Test 1: Single COD order with sufficient stock (qty <= stock) succeeds', () => {
  /**
   * Property: For all single COD orders where requestedQty <= availableStock,
   *   createOrder returns HTTP 201, finalStock = initialStock - requestedQty,
   *   and both Order and Payment are created.
   *
   * Validates: Unchanged Behavior 4 (Requirements 4.3, 4.4)
   */

  const successCases = [
    { initialStock: 5, requestedQty: 1, label: 'stock=5, qty=1 (well within stock)' },
    { initialStock: 10, requestedQty: 5, label: 'stock=10, qty=5 (half of stock)' },
    { initialStock: 100, requestedQty: 50, label: 'stock=100, qty=50 (large quantity)' },
  ];

  test.each(successCases)(
    'COD order succeeds and decrements stock correctly: $label',
    async ({ initialStock, requestedQty }) => {
      // ARRANGE
      const { getStock } = setupCommonMocks({ initialStock, requestedQty });
      const req = mockCODReq('user-id-1');
      const res = mockRes();

      // ACT — single (non-concurrent) COD order
      await createOrder(req as any, res);

      // ASSERT
      // HTTP 201 — order succeeded
      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({ success: true });

      // finalStock = initialStock - requestedQty
      const finalStock = getStock();
      expect(finalStock).toBe(initialStock - requestedQty);

      // Order was created in the DB
      expect(Order.create).toHaveBeenCalledTimes(1);

      // Payment was created in the DB (COD payment record)
      expect(Payment.create).toHaveBeenCalledTimes(1);
      expect(Payment.create).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'cod', status: 'pending' })
      );

      // Cart was cleared after the order
      expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-id-1' }),
        { items: [] }
      );
    }
  );

  it('Stock is exactly decremented by requestedQty (not more, not less)', async () => {
    // ARRANGE: stock=20, qty=7
    const initialStock = 20;
    const requestedQty = 7;
    const { getStock } = setupCommonMocks({ initialStock, requestedQty });

    const req = mockCODReq('user-id-1');
    const res = mockRes();

    // ACT
    await createOrder(req as any, res);

    // ASSERT
    expect(res.statusCode).toBe(201);
    expect(getStock()).toBe(initialStock - requestedQty); // 20 - 7 = 13
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Test 2 — Razorpay branch atomic decrement baseline (unchanged behavior)
// ═════════════════════════════════════════════════════════════════════════════

describe('Test 2: Razorpay branch atomic decrement baseline (unchanged by the COD fix)', () => {
  /**
   * Property: For all Razorpay orders with sufficient stock, createOrder uses the
   *   atomic findOneAndUpdate + $gte guard, succeeds, and decrements stock correctly.
   *   This confirms the Razorpay branch is NOT touched by the COD fix.
   *
   * Validates: Unchanged Behavior 4 (Requirements 4.3, 4.4) — Razorpay branch unchanged
   */

  it('Razorpay order with sufficient stock returns HTTP 201 and decrements stock via atomic $gte update', async () => {
    // ARRANGE
    const initialStock = 10;
    const requestedQty = 3;
    const { getStock } = setupCommonMocks({ initialStock, requestedQty });

    const req = mockCashfreeReq('user-id-1');
    const res = mockRes();

    // ACT
    await createOrder(req as any, res);

    // ASSERT
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ success: true });

    // Cashfree branch uses findOneAndUpdate (atomic $gte guard), NOT findByIdAndUpdate
    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ stock: { $gte: requestedQty } }),
      expect.objectContaining({ $inc: { stock: -requestedQty, sold: requestedQty } }),
      expect.objectContaining({ new: true })
    );

    // Stock was decremented by the atomic update
    expect(getStock()).toBe(initialStock - requestedQty); // 10 - 3 = 7

    // Cashfree payment record was created
    expect(Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'cashfree', status: 'pending' })
    );
  });

  it('Razorpay branch does NOT call findByIdAndUpdate for stock (COD-style unconditional $inc)', async () => {
    // ARRANGE — verify that the Razorpay code path never uses unconditional findByIdAndUpdate
    const { getStock } = setupCommonMocks({ initialStock: 5, requestedQty: 2 });

    const req = mockCashfreeReq('user-id-1');
    const res = mockRes();

    // ACT
    await createOrder(req as any, res);

    // ASSERT: Razorpay path goes through findOneAndUpdate (atomic), not findByIdAndUpdate
    expect(res.statusCode).toBe(201);

    // The Razorpay branch must use findOneAndUpdate (has the $gte guard)
    expect(Product.findOneAndUpdate).toHaveBeenCalled();

    // findByIdAndUpdate should NOT have been called for stock in the Razorpay path
    // (findByIdAndUpdate is only called for COD in unfixed code, or for rollback)
    const findByIdUpdateCalls = (Product.findByIdAndUpdate as jest.Mock).mock.calls;
    const stockDecrementCalls = findByIdUpdateCalls.filter(
      ([_id, update]: any[]) => update.$inc?.stock !== undefined && update.$inc.stock < 0
    );
    expect(stockDecrementCalls).toHaveLength(0);

    // Stock was correctly decremented
    expect(getStock()).toBe(3); // 5 - 2
  });

  it('Razorpay branch returns 400 when $gte guard fails (stock insufficient)', async () => {
    // ARRANGE: stock=2, qty=5 — $gte guard will fail
    const initialStock = 2;
    const requestedQty = 5;
    const { getStock } = setupCommonMocks({ initialStock, requestedQty });

    const req = mockCashfreeReq('user-id-1');
    const res = mockRes();

    // ACT
    await createOrder(req as any, res);

    // ASSERT: pre-check catches this before reaching the Razorpay branch
    // (pre-check loop runs before payment method split)
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ success: false });

    // Stock is unchanged — nothing was decremented
    expect(getStock()).toBe(initialStock);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Test 3 — COD boundary case: requestedQty === availableStock
// ═════════════════════════════════════════════════════════════════════════════

describe('Test 3: COD order boundary case — requestedQty === availableStock succeeds', () => {
  /**
   * Property: A single COD order where requestedQty exactly equals availableStock
   *   must succeed (HTTP 201) and result in finalStock === 0.
   *
   * Validates: Unchanged Behavior 4 (Requirements 4.3, 4.4)
   */

  const boundaryCases = [
    { stock: 1, label: 'stock=1, qty=1 (last unit)' },
    { stock: 5, label: 'stock=5, qty=5 (all units)' },
    { stock: 100, label: 'stock=100, qty=100 (all 100 units)' },
  ];

  test.each(boundaryCases)(
    'COD boundary succeeds with finalStock===0: $label',
    async ({ stock }) => {
      // ARRANGE: requestedQty exactly equals availableStock
      const { getStock } = setupCommonMocks({ initialStock: stock, requestedQty: stock });

      const req = mockCODReq('user-id-1');
      const res = mockRes();

      // ACT
      await createOrder(req as any, res);

      // ASSERT
      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({ success: true });

      // finalStock === 0 exactly
      expect(getStock()).toBe(0);
    }
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// Test 4 — COD order with qty > stock fails (pre-check guard)
// ═════════════════════════════════════════════════════════════════════════════

describe('Test 4: COD order with requestedQty > availableStock returns 400 (pre-check)', () => {
  /**
   * Property: A single COD order where requestedQty > availableStock must return
   *   HTTP 400 and leave stock unchanged.
   *   The pre-check loop above the payment split prevents over-ordering.
   *
   * Validates: Unchanged Behavior 4 (Requirements 4.3, 4.4)
   */

  const overStockCases = [
    { initialStock: 0, requestedQty: 1, label: 'stock=0, qty=1 (out of stock)' },
    { initialStock: 3, requestedQty: 5, label: 'stock=3, qty=5 (qty exceeds stock)' },
    { initialStock: 10, requestedQty: 11, label: 'stock=10, qty=11 (one over stock)' },
    { initialStock: 1, requestedQty: 2, label: 'stock=1, qty=2 (double stock)' },
  ];

  test.each(overStockCases)(
    'COD order fails with 400 when qty > stock: $label',
    async ({ initialStock, requestedQty }) => {
      // ARRANGE
      const { getStock } = setupCommonMocks({ initialStock, requestedQty });

      const req = mockCODReq('user-id-1');
      const res = mockRes();

      // ACT
      await createOrder(req as any, res);

      // ASSERT
      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({ success: false });
      expect(res.body.message).toMatch(/insufficient stock/i);

      // Stock must be unchanged — no decrement happened
      expect(getStock()).toBe(initialStock);

      // Order must NOT have been created
      expect(Order.create).not.toHaveBeenCalled();

      // Payment must NOT have been created
      expect(Payment.create).not.toHaveBeenCalled();
    }
  );

  it('Stock is NOT decremented when pre-check fails (stock unchanged after 400)', async () => {
    // Explicit single test to document the preservation invariant clearly
    const initialStock = 2;
    const requestedQty = 10;
    const { getStock } = setupCommonMocks({ initialStock, requestedQty });

    const req = mockCODReq('user-id-1');
    const res = mockRes();

    await createOrder(req as any, res);

    expect(res.statusCode).toBe(400);
    expect(getStock()).toBe(initialStock); // stock completely unchanged

    // No DB writes for order or payment
    expect(Order.create).not.toHaveBeenCalled();
    expect(Payment.create).not.toHaveBeenCalled();

    // Pre-check should not reach the $inc call
    const findByIdUpdateCalls = (Product.findByIdAndUpdate as jest.Mock).mock.calls;
    const stockDecrements = findByIdUpdateCalls.filter(
      ([_id, update]: any[]) => update.$inc?.stock !== undefined && update.$inc.stock < 0
    );
    expect(stockDecrements).toHaveLength(0);
  });
});
