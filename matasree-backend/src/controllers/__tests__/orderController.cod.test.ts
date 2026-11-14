/**
 * Unit Tests — Bug 4 Fix: COD Atomic Conditional Stock Decrement
 *
 * PURPOSE: Verify the specific fix mechanics of the COD branch:
 *   1. When findOneAndUpdate returns null on the 2nd item → rollback 1st item,
 *      delete order and payment, return 400 with "out of stock" message.
 *   2. When findOneAndUpdate succeeds for all items → order created, stock correct, 200.
 *   3. Rollback correctly reverses all previously decremented items in a multi-item order.
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
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

function mockCODReq(userId = 'user-id-1') {
  return {
    body: { addressId: 'address-id-1', paymentMethod: 'cod' },
    user: { userId },
    headers: {},
    ip: '127.0.0.1',
    cookies: {},
  } as unknown as Request;
}

const STANDARD_ADDRESS = {
  _id: 'address-id-1',
  name: 'Test User',
  addressLine1: '123 Test St',
  city: 'Testville',
  state: 'TS',
  pincode: '123456',
  phone: '9999999999',
};

let orderIdCounter = 0;

/**
 * Builds a cart mock with the given items array.
 * Each item: { productId, name, price, quantity }
 */
function setupCartWithItems(items: Array<{ productId: string; name: string; price: number; quantity: number }>) {
  const cartItems = items.map(item => ({
    productId: {
      _id: item.productId,
      name: item.name,
      price: item.price,
      image: `${item.name.toLowerCase()}.jpg`,
    },
    price: item.price,
    quantity: item.quantity,
  }));

  (Cart.findOne as jest.Mock).mockReturnValue({
    populate: jest.fn().mockResolvedValue({
      userId: 'user-id-1',
      items: cartItems,
    }),
  });
}

function setupCommonMocks() {
  (Address.findById as jest.Mock).mockResolvedValue(STANDARD_ADDRESS);

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
  (Payment.create as jest.Mock).mockResolvedValue({ _id: 'payment-id-1' });
  (Payment.deleteOne as jest.Mock).mockResolvedValue({});

  (User.findById as jest.Mock).mockReturnValue({
    select: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
  });
}

beforeEach(() => {
  orderIdCounter = 0;
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════════
// Test 1 — Rollback on 2nd item findOneAndUpdate returning null
// ═══════════════════════════════════════════════════════════════════════════════

describe('Test 1: Rollback when findOneAndUpdate returns null on the 2nd item', () => {
  /**
   * Scenario: 2-item COD order.
   *   - Item A (productId='prod-A', qty=1): findOneAndUpdate succeeds → product returned
   *   - Item B (productId='prod-B', qty=1): findOneAndUpdate returns null (stock guard fails)
   * Expected:
   *   - Item A's stock is rolled back via findByIdAndUpdate($inc: +qty)
   *   - Order is deleted
   *   - Payment is deleted
   *   - Response: 400 with "out of stock" message
   */

  let stockA: number;
  let stockB: number;

  beforeEach(() => {
    // Both start at 1 unit so the pre-check (findById) passes for both.
    // Then findOneAndUpdate for prod-B returns null to simulate the atomic guard
    // failing under a race condition (another request just grabbed the last unit).
    stockA = 5;
    stockB = 1; // passes pre-check, but findOneAndUpdate will return null for it

    setupCommonMocks();

    setupCartWithItems([
      { productId: 'prod-A', name: 'Product A', price: 100, quantity: 1 },
      { productId: 'prod-B', name: 'Product B', price: 200, quantity: 1 },
    ]);

    // Pre-check: findById returns sufficient stock for both (pre-check passes)
    (Product.findById as jest.Mock).mockImplementation(async (id: any) => {
      if (id === 'prod-A') return { _id: 'prod-A', name: 'Product A', stock: stockA, price: 100 };
      if (id === 'prod-B') return { _id: 'prod-B', name: 'Product B', stock: stockB, price: 200 };
      return null;
    });

    // findOneAndUpdate: prod-A succeeds (atomic decrement), prod-B returns null
    // (simulates stock being grabbed by a concurrent request between pre-check and decrement)
    (Product.findOneAndUpdate as jest.Mock).mockImplementation(
      async (filter: any, update: any, _opts: any) => {
        if (String(filter._id) === 'prod-A') {
          stockA -= Math.abs(update.$inc?.stock ?? 0);
          return { _id: 'prod-A', name: 'Product A', stock: stockA };
        }
        return null; // prod-B fails — atomic guard returned null
      }
    );

    // findByIdAndUpdate: used for rollback
    (Product.findByIdAndUpdate as jest.Mock).mockImplementation(async (id: any, update: any) => {
      if (String(id) === 'prod-A' && update.$inc?.stock > 0) {
        stockA += update.$inc.stock;
      }
      return { _id: id };
    });
  });

  it('returns HTTP 400 with out-of-stock message when 2nd item guard fails', async () => {
    const req = mockCODReq();
    const res = mockRes();

    await createOrder(req as any, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ success: false });
    expect(res.body.message).toMatch(/out of stock/i);
  });

  it('rolls back item A stock when item B fails (findByIdAndUpdate called with +qty for A)', async () => {
    const initialStockA = stockA;
    const req = mockCODReq();
    const res = mockRes();

    await createOrder(req as any, res);

    expect(res.statusCode).toBe(400);

    // findByIdAndUpdate should have been called to reverse item A's decrement
    const rollbackCalls = (Product.findByIdAndUpdate as jest.Mock).mock.calls.filter(
      ([id, update]: any[]) => String(id) === 'prod-A' && update.$inc?.stock > 0
    );
    expect(rollbackCalls).toHaveLength(1);
    expect(rollbackCalls[0][1]).toMatchObject({ $inc: { stock: 1, sold: -1 } });

    // Stock A should be back to initial value after rollback
    expect(stockA).toBe(initialStockA);
  });

  it('deletes the order record when rollback occurs', async () => {
    const req = mockCODReq();
    const res = mockRes();

    await createOrder(req as any, res);

    expect(Order.findByIdAndDelete).toHaveBeenCalledTimes(1);
  });

  it('deletes the payment record when rollback occurs', async () => {
    const req = mockCODReq();
    const res = mockRes();

    await createOrder(req as any, res);

    expect(Payment.deleteOne).toHaveBeenCalledTimes(1);
    expect(Payment.deleteOne).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: expect.anything() })
    );
  });

  it('does NOT clear the cart when rollback occurs (order failed)', async () => {
    const req = mockCODReq();
    const res = mockRes();

    await createOrder(req as any, res);

    // Cart.findOneAndUpdate (clear cart) should NOT have been called for a failed order
    expect(Cart.findOneAndUpdate).not.toHaveBeenCalledWith(
      expect.anything(),
      { items: [] }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Test 2 — All items succeed → order created, correct HTTP 201
// ═══════════════════════════════════════════════════════════════════════════════

describe('Test 2: All findOneAndUpdate succeed → order created, 201 response', () => {
  /**
   * Scenario: 2-item COD order, both items have sufficient stock.
   *   - Item A (productId='prod-A', qty=2, stock=10): guard passes
   *   - Item B (productId='prod-B', qty=3, stock=10): guard passes
   * Expected:
   *   - Response: 201
   *   - stockA decremented by 2
   *   - stockB decremented by 3
   *   - Order.create called once
   *   - Payment.create called once (COD payment)
   *   - Cart cleared
   */

  let stockA: number;
  let stockB: number;

  beforeEach(() => {
    stockA = 10;
    stockB = 10;

    setupCommonMocks();

    setupCartWithItems([
      { productId: 'prod-A', name: 'Product A', price: 100, quantity: 2 },
      { productId: 'prod-B', name: 'Product B', price: 200, quantity: 3 },
    ]);

    (Product.findById as jest.Mock).mockImplementation(async (id: any) => {
      if (id === 'prod-A') return { _id: 'prod-A', name: 'Product A', stock: stockA, price: 100 };
      if (id === 'prod-B') return { _id: 'prod-B', name: 'Product B', stock: stockB, price: 200 };
      return null;
    });

    (Product.findOneAndUpdate as jest.Mock).mockImplementation(
      async (filter: any, update: any, _opts: any) => {
        const qtyDecrement = Math.abs(update.$inc?.stock ?? 0);
        const id = String(filter._id);
        if (id === 'prod-A' && filter.stock?.$gte <= stockA) {
          stockA -= qtyDecrement;
          return { _id: 'prod-A', name: 'Product A', stock: stockA };
        }
        if (id === 'prod-B' && filter.stock?.$gte <= stockB) {
          stockB -= qtyDecrement;
          return { _id: 'prod-B', name: 'Product B', stock: stockB };
        }
        return null;
      }
    );

    (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
  });

  it('returns HTTP 201 when all items succeed', async () => {
    const req = mockCODReq();
    const res = mockRes();

    await createOrder(req as any, res);

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ success: true });
  });

  it('decrements stock for all items via atomic findOneAndUpdate', async () => {
    const req = mockCODReq();
    const res = mockRes();

    await createOrder(req as any, res);

    // Both items should have been atomically decremented
    expect(Product.findOneAndUpdate).toHaveBeenCalledTimes(2);

    // Verify correct stock decrements
    expect(stockA).toBe(8);  // 10 - 2
    expect(stockB).toBe(7);  // 10 - 3
  });

  it('creates one order and one COD payment record', async () => {
    const req = mockCODReq();
    const res = mockRes();

    await createOrder(req as any, res);

    expect(Order.create).toHaveBeenCalledTimes(1);
    expect(Payment.create).toHaveBeenCalledTimes(1);
    expect(Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'cod', status: 'pending' })
    );
  });

  it('clears the cart after a successful order', async () => {
    const req = mockCODReq();
    const res = mockRes();

    await createOrder(req as any, res);

    expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-id-1' }),
      { items: [] }
    );
  });

  it('does NOT call rollback (findByIdAndUpdate for stock reversal) on success', async () => {
    const req = mockCODReq();
    const res = mockRes();

    await createOrder(req as any, res);

    // findByIdAndUpdate with positive stock increment = rollback, should not happen
    const rollbackCalls = (Product.findByIdAndUpdate as jest.Mock).mock.calls.filter(
      ([_id, update]: any[]) => update.$inc?.stock > 0
    );
    expect(rollbackCalls).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Test 3 — Multi-item rollback: A succeeds, B fails → A reversed, C never touched
// ═══════════════════════════════════════════════════════════════════════════════

describe('Test 3: Multi-item partial rollback — A succeeds, B fails, C not reached', () => {
  /**
   * Scenario: 3-item COD order (A, B, C).
   *   - Item A (qty=1, stock=5): findOneAndUpdate succeeds
   *   - Item B (qty=1, stock=0): findOneAndUpdate returns null (guard fails)
   *   - Item C (qty=1, stock=5): never reached (loop breaks at B)
   * Expected:
   *   - Only item A is rolled back (findByIdAndUpdate called once for A, never for C)
   *   - Item C's stock is never decremented (findOneAndUpdate only called twice: A and B)
   *   - Order deleted, Payment deleted
   *   - Response: 400
   */

  let stockA: number;
  let stockB: number;
  let stockC: number;

  beforeEach(() => {
    stockA = 5;
    stockB = 0; // out of stock
    stockC = 5;

    setupCommonMocks();

    setupCartWithItems([
      { productId: 'prod-A', name: 'Product A', price: 100, quantity: 1 },
      { productId: 'prod-B', name: 'Product B', price: 150, quantity: 1 },
      { productId: 'prod-C', name: 'Product C', price: 200, quantity: 1 },
    ]);

    (Product.findById as jest.Mock).mockImplementation(async (id: any) => {
      const map: Record<string, any> = {
        'prod-A': { _id: 'prod-A', name: 'Product A', stock: stockA, price: 100 },
        'prod-B': { _id: 'prod-B', name: 'Product B', stock: stockB, price: 150 },
        'prod-C': { _id: 'prod-C', name: 'Product C', stock: stockC, price: 200 },
      };
      return map[String(id)] || null;
    });

    // Pre-check reads: prod-A (stock=5, ok) → prod-B (stock=0, fails pre-check)
    // Wait — the pre-check loop will catch B at pre-check because stock=0 < qty=1
    // We need B to pass the pre-check to test the atomic guard rollback.
    // Set stockB=1 for pre-check, then findOneAndUpdate returns null for B.
    // Let's re-think: the pre-check runs findById, then the COD loop runs findOneAndUpdate.
    // To isolate rollback testing, we need B to pass pre-check but fail the atomic guard.
    // We mock findById to return stock=1 for all (so pre-check passes),
    // then findOneAndUpdate returns null only for B.

    stockB = 1; // enough for pre-check to pass

    (Product.findById as jest.Mock).mockImplementation(async (id: any) => {
      if (id === 'prod-A') return { _id: 'prod-A', name: 'Product A', stock: 5, price: 100 };
      if (id === 'prod-B') return { _id: 'prod-B', name: 'Product B', stock: stockB, price: 150 };
      if (id === 'prod-C') return { _id: 'prod-C', name: 'Product C', stock: 5, price: 200 };
      return null;
    });

    (Product.findOneAndUpdate as jest.Mock).mockImplementation(
      async (filter: any, update: any, _opts: any) => {
        const id = String(filter._id);
        if (id === 'prod-A') {
          stockA -= Math.abs(update.$inc?.stock ?? 0);
          return { _id: 'prod-A', name: 'Product A', stock: stockA };
        }
        if (id === 'prod-B') {
          return null; // atomic guard fails for B
        }
        // prod-C should never be reached
        stockC -= Math.abs(update.$inc?.stock ?? 0);
        return { _id: 'prod-C', name: 'Product C', stock: stockC };
      }
    );

    (Product.findByIdAndUpdate as jest.Mock).mockImplementation(async (id: any, update: any) => {
      if (String(id) === 'prod-A' && update.$inc?.stock > 0) {
        stockA += update.$inc.stock;
      }
      return { _id: id };
    });
  });

  it('returns HTTP 400 with out-of-stock message', async () => {
    const req = mockCODReq();
    const res = mockRes();

    await createOrder(req as any, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/out of stock/i);
  });

  it('findOneAndUpdate is called for A and B but NOT for C (loop breaks at B failure)', async () => {
    const req = mockCODReq();
    const res = mockRes();

    await createOrder(req as any, res);

    const findOneAndUpdateCalls = (Product.findOneAndUpdate as jest.Mock).mock.calls;
    // Should be called exactly twice: once for A (succeeds), once for B (returns null, breaks loop)
    expect(findOneAndUpdateCalls).toHaveLength(2);

    const calledIds = findOneAndUpdateCalls.map(([filter]: any[]) => String(filter._id));
    expect(calledIds).toContain('prod-A');
    expect(calledIds).toContain('prod-B');
    expect(calledIds).not.toContain('prod-C');
  });

  it('rolls back item A stock but does NOT roll back C (C was never decremented)', async () => {
    const initialStockA = 5;
    const req = mockCODReq();
    const res = mockRes();

    await createOrder(req as any, res);

    // Rollback calls (positive $inc.stock) — should be exactly 1 (for A)
    const rollbackCalls = (Product.findByIdAndUpdate as jest.Mock).mock.calls.filter(
      ([_id, update]: any[]) => update.$inc?.stock > 0
    );
    expect(rollbackCalls).toHaveLength(1);

    const rollbackIds = rollbackCalls.map(([id]: any[]) => String(id));
    expect(rollbackIds).toContain('prod-A');
    expect(rollbackIds).not.toContain('prod-C');

    // A's stock is fully restored
    expect(stockA).toBe(initialStockA);

    // C's stock is untouched
    expect(stockC).toBe(5);
  });

  it('deletes order and payment on rollback', async () => {
    const req = mockCODReq();
    const res = mockRes();

    await createOrder(req as any, res);

    expect(Order.findByIdAndDelete).toHaveBeenCalledTimes(1);
    expect(Payment.deleteOne).toHaveBeenCalledTimes(1);
  });
});
