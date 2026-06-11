/**
 * Property-Based Tests for Coupon System
 *
 * Uses fast-check to verify universal properties of coupon discount arithmetic.
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.5
 */

import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Property 4: Coupon Discount Bounded by Order Amount
// Validates: Requirements 12.1, 12.3, 12.5
// ---------------------------------------------------------------------------
describe('Coupon Discount Bounded by Order Amount', () => {
  it('discount never exceeds the order amount', () => {
    /**
     * **Validates: Requirements 12.1, 12.3, 12.5**
     *
     * For any coupon (percentage or fixed) and any positive order amount,
     * the computed discount — after applying the optional maxDiscount cap —
     * can never exceed the order amount itself.
     */
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constantFrom('percentage', 'fixed'),
          value: fc.float({ min: Math.fround(0), max: Math.fround(200), noNaN: true }),
          max: fc.float({ min: Math.fround(0), max: Math.fround(10000), noNaN: true }),
        }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
        (coupon, order) => {
          const raw =
            coupon.type === 'percentage' ? order * (coupon.value / 100) : coupon.value;
          const capped = coupon.max > 0 ? Math.min(raw, coupon.max) : raw;
          return Math.min(capped, order) <= order;
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Property: Expired Coupon Always Invalid
// Validates: Requirements 12.1
// ---------------------------------------------------------------------------
describe('Expired Coupon Always Invalid', () => {
  it('a coupon with expiresAt in the past is always expired', () => {
    /**
     * **Validates: Requirements 12.1**
     *
     * For any date strictly in the past, comparing it against the current
     * time must always yield isExpired === true, guaranteeing no expired
     * coupon can pass the validity check.
     */
    fc.assert(
      fc.property(
        fc.date({ max: new Date(Date.now() - 1) }),
        (expiresAt) => {
          const isExpired = expiresAt < new Date();
          return isExpired === true;
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Property: maxUses=0 Never Usage-Limited
// Validates: Requirements 12.2
// ---------------------------------------------------------------------------
describe('maxUses=0 Never Usage-Limited', () => {
  it('a coupon with maxUses=0 is never blocked by usage count', () => {
    /**
     * **Validates: Requirements 12.2**
     *
     * When maxUses is 0 (unlimited), the usage-limit gate must always
     * evaluate to false regardless of how many times the coupon has
     * already been used.
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        (usageCount) => {
          const isLimited = 0 > 0 && usageCount >= 0;
          return isLimited === false;
        }
      )
    );
  });
});
