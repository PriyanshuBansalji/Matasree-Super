/**
 * Property-Based Tests — Bug 4 Fix: COD Stock Non-Negativity
 *
 * PURPOSE: Verify that for any combination of (stock, concurrentOrders, qtyPerOrder)
 *   where concurrent demand can meet or exceed stock, the fixed COD branch ensures:
 *     1. Product stock never goes negative.
 *     2. Total successfully fulfilled quantity does not exceed initial stock.
 *
 * Uses fast-check for property-based generation (confirmed present in package.json).
 *
 * **Validates: Requirements 4.1, 4.2**
 */

import * as fc from 'fast-check';
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

let orderIdCounter = 0;

/**
 * Set up all the mocks for a scenario where `concurrentOrders` requests
 * each ask for `qtyPerOrder` units of a single product that starts with `initialStock`.
 *
 * The key mock is Product.findOneAndUpdate — it simulates the atomic MongoDB
 * conditional update: only decrements if current stock >= requested quantity.
 * This is done with a mutex-like synchronous closure over the `stock` variable,
 * which is safe in the single-threaded Node.js event loop used in tests.
 *
 * Returns a getter for the current stock value.
 */
function setupConcurrentScenario(
  initialStock: number,
  qtyPerOrder: number,
  productId = 'prod-1'
): { getStock: () => number } {
  let stock = initialStock;

  // Pre-check (findById): all concurrent requests read the initial snapshot.
  // In real MongoDB this is the race window — all see enough stock.
  (Product.findById as jest.Mock).mockResolvedValue({
    _id: productId,
    name: 'Test Product',
    stock: initialStock, // snapshot — everyone sees the initial value
    price: 100,
  });

  // Atomic guard: simulates MongoDB's compare-and-set behaviour.
  // Uses the shared `stock` closure — only one request can decrement at a time
  // in Node.js's single-threaded promise microtask queue.
  (Product.findOneAndUpdate as jest.Mock).mockImplementation(
    async (filter: any, update: any, _opts: any) => {
      // Simulate the $gte guard atomically
      if (stock >= qtyPerOrder) {
        stock -= Math.abs(update.$inc?.stock ?? 0);
        return { _id: productId, name: 'Test Product', stock };
      }
      return null; // guard failed
    }
  );

  // Rollback: called when the guard fails for a later item (reverses decrements)
  (Product.findByIdAndUpdate as jest.Mock).mockImplementation(async (_id: any, update: any) => {
    if (update.$inc?.stock > 0) {
      stock += update.$inc.stock;
    }
    return { _id: _id };
  });

  // Cart: each user has one item with the requested quantity
  (Cart.findOne as jest.Mock).mockReturnValue({
    populate: jest.fn().mockResolvedValue({
      userId: 'user-id',
      items: [
        {
          productId: { _id: productId, name: 'Test Product', price: 100, image: 'img.jpg' },
          price: 100,
          quantity: qtyPerOrder,
        },
      ],
    }),
  });

  (Address.findById as jest.Mock).mockResolvedValue({
    _id: 'address-id-1',
    name: 'Test User',
    addressLine1: '123 Test St',
    city: 'City',
    state: 'ST',
    pincode: '123456',
    phone: '9999999999',
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
    select: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
  });

  return { getStock: () => stock };
}

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe('PBT: COD Stock Non-Negativity (Bug 4 Fix)', () => {
  beforeEach(() => {
    orderIdCounter = 0;
    jest.clearAllMocks();
  });

  /**
   * Property 1 (fast-check): For all (stock ≥ 1, concurrentOrders ≥ 2, qtyPerOrder ≥ 1)
   *   where concurrentOrders * qtyPerOrder >= stock (demand meets or exceeds supply),
   *   stock must never go negative after all concurrent COD orders settle.
   *
   * **Validates: Requirements 4.1, 4.2**
   */
  it(
    'Property 1: stock never goes negative for any (stock, concurrentOrders, qtyPerOrder) triple ' +
    'where concurrent demand >= available stock',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // stock: 1..10, concurrentOrders: 2..6, qtyPerOrder: 1..5
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 2, max: 6 }),
          fc.integer({ min: 1, max: 5 }),
          async (stock, concurrentOrders, qtyPerOrder) => {
            // Only test cases where demand can exceed stock (the race condition scenario)
            fc.pre(concurrentOrders * qtyPerOrder >= stock);

            jest.clearAllMocks();
            orderIdCounter = 0;

            const { getStock } = setupConcurrentScenario(stock, qtyPerOrder);

            // Fire all concurrent COD orders simultaneously
            const requests = Array.from({ length: concurrentOrders }, (_, i) => {
              const req = mockCODReq(`user-id-${i}`);
              const res = mockRes();
              return createOrder(req as any, res).then(() => res);
            });

            await Promise.all(requests);

            const finalStock = getStock();

            // CORE INVARIANT: stock must never be negative
            expect(finalStock).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 50, verbose: false }
      );
    },
    30000 // extended timeout for 50 runs
  );

  /**
   * Property 2 (fast-check): Total successfully fulfilled quantity
   *   must not exceed the initial stock.
   *
   * **Validates: Requirements 4.1, 4.2**
   */
  it(
    'Property 2: total successfully fulfilled quantity never exceeds initial stock',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 2, max: 6 }),
          fc.integer({ min: 1, max: 5 }),
          async (stock, concurrentOrders, qtyPerOrder) => {
            fc.pre(concurrentOrders * qtyPerOrder >= stock);

            jest.clearAllMocks();
            orderIdCounter = 0;

            setupConcurrentScenario(stock, qtyPerOrder);

            const requests = Array.from({ length: concurrentOrders }, (_, i) => {
              const req = mockCODReq(`user-id-${i}`);
              const res = mockRes();
              return createOrder(req as any, res).then(() => res);
            });

            const responses = await Promise.all(requests);

            const successCount = responses.filter(r => r.statusCode === 201).length;
            const totalFulfilled = successCount * qtyPerOrder;

            // INVARIANT: cannot fulfill more units than were available
            expect(totalFulfilled).toBeLessThanOrEqual(stock);
          }
        ),
        { numRuns: 50, verbose: false }
      );
    },
    30000
  );

  /**
   * Deterministic cases: 5 manually crafted scenarios covering key edge cases.
   * These complement the fast-check runs with documented, reproducible inputs.
   *
   * **Validates: Requirements 4.1, 4.2**
   */
  const deterministicCases = [
    { stock: 1,  concurrent: 2,  qty: 1, label: 'stock=1, 2 concurrent requests of qty=1' },
    { stock: 3,  concurrent: 5,  qty: 1, label: 'stock=3, 5 concurrent requests of qty=1' },
    { stock: 2,  concurrent: 3,  qty: 1, label: 'stock=2, 3 concurrent requests of qty=1' },
    { stock: 5,  concurrent: 3,  qty: 2, label: 'stock=5, 3 concurrent requests of qty=2' },
    { stock: 10, concurrent: 4,  qty: 3, label: 'stock=10, 4 concurrent requests of qty=3' },
  ];

  test.each(deterministicCases)(
    'Deterministic: $label → stock ≥ 0 and fulfilled ≤ initial',
    async ({ stock, concurrent, qty }) => {
      const { getStock } = setupConcurrentScenario(stock, qty);

      const requests = Array.from({ length: concurrent }, (_, i) => {
        const req = mockCODReq(`user-id-${i}`);
        const res = mockRes();
        return createOrder(req as any, res).then(() => res);
      });

      const responses = await Promise.all(requests);
      const finalStock = getStock();

      // Stock must never go negative
      expect(finalStock).toBeGreaterThanOrEqual(0);

      // Total fulfilled must not exceed initial stock
      const successCount = responses.filter(r => r.statusCode === 201).length;
      expect(successCount * qty).toBeLessThanOrEqual(stock);

      // At least one request must have been rejected when demand exceeds stock
      if (concurrent * qty > stock) {
        const failCount = responses.filter(r => r.statusCode === 400).length;
        expect(failCount).toBeGreaterThan(0);
      }
    }
  );
});
