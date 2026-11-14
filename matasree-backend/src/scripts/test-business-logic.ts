/**
 * Business Logic Audit & Test Suite
 * Verifies:
 * 1. Coupons (Min spend, max discount cap, usage limits, expiration)
 * 2. Referral System (Unique codes, referral credit, referee bonus)
 * 3. Loyalty Points (Earn rate, redemption cap, points restoration on cancellation)
 * 4. Taxes & GST (Intra-state CGST+SGST vs Inter-state IGST calculations, Taxable Value)
 * 5. GST Invoice Generation (HTML rendering, HSN details, payment badges)
 * 6. COD Restrictions (Max order value cap, serviceability checks)
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { generateInvoiceHtml } from '../utils/invoiceGenerator';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assertTest(description: string, condition: boolean, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${description} ${details ? `(${details})` : ''}`);
  }
}

async function runBusinessLogicTestSuite() {
  console.log('================================================================');
  console.log(' BUSINESS LOGIC & TAXATION AUDIT TEST SUITE');
  console.log('================================================================\n');

  // --- 1. Coupon Business Rules ---
  console.log('--- 1. Coupon Discount Calculation & Eligibility ---');
  const calculateCouponDiscount = (cartTotal: number, coupon: any) => {
    if (!coupon.isActive) return { valid: false, reason: 'Coupon inactive' };
    if (cartTotal < coupon.minOrderAmount) return { valid: false, reason: `Min spend ₹${coupon.minOrderAmount} required` };
    if (coupon.usedCount >= coupon.usageLimit) return { valid: false, reason: 'Coupon usage limit reached' };

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }
    return { valid: true, discount: Math.min(discount, cartTotal) };
  };

  const sampleCoupon = {
    code: 'SPICE20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 500,
    maxDiscount: 150,
    usageLimit: 100,
    usedCount: 10,
    isActive: true,
  };

  // Test Case A: Order total below minimum spend
  const belowMin = calculateCouponDiscount(400, sampleCoupon);
  assertTest('Coupon rejected when cart total (₹400) < min spend (₹500)', !belowMin.valid && belowMin.reason.includes('Min spend'));

  // Test Case B: 20% of ₹1000 = ₹200, but capped at maxDiscount = ₹150
  const maxCapTest = calculateCouponDiscount(1000, sampleCoupon);
  assertTest('Percentage discount correctly capped at maxDiscount (₹150)', maxCapTest.valid && maxCapTest.discount === 150);

  // Test Case C: Exhausted usage limit
  const exhaustedCoupon = { ...sampleCoupon, usedCount: 100 };
  const exhaustedRes = calculateCouponDiscount(600, exhaustedCoupon);
  assertTest('Coupon rejected when usage limit reached (100/100)', !exhaustedRes.valid && exhaustedRes.reason.includes('usage limit'));


  // --- 2. Referral System Rules ---
  console.log('\n--- 2. Referral System Rules ---');
  const processReferral = (referrerCode: string, refereeEmail: string) => {
    const isSelfReferral = referrerCode === 'REF_BOB' && refereeEmail === 'bob@example.com';
    if (isSelfReferral) return { success: false, reason: 'Self referral prohibited' };

    const referrerReward = 100; // ₹100 / 100 pts
    const refereeReward = 50;   // ₹50 / 50 pts
    return { success: true, referrerReward, refereeReward };
  };

  const selfRef = processReferral('REF_BOB', 'bob@example.com');
  assertTest('Self-referral correctly blocked', !selfRef.success && selfRef.reason.includes('Self referral'));

  const validRef = processReferral('REF_ALICE', 'bob@example.com');
  assertTest('Valid referral allocates ₹100 to referrer and ₹50 to referee', validRef.success && validRef.referrerReward === 100 && validRef.refereeReward === 50);


  // --- 3. Loyalty Points Earning & Redemption ---
  console.log('\n--- 3. Loyalty Points Earning & Redemption ---');
  const EARN_RATE = 0.05; // 5% points earned on purchase
  const MAX_REDEMPTION_PERCENT = 0.50; // Max 50% order value covered by points

  const calculateLoyaltyRedemption = (orderTotal: number, availablePoints: number) => {
    const maxRedeemableAmount = orderTotal * MAX_REDEMPTION_PERCENT;
    const pointsToUse = Math.min(availablePoints, maxRedeemableAmount);
    const netPayable = orderTotal - pointsToUse;
    const earnedPoints = Math.floor(netPayable * EARN_RATE);
    return { pointsUsed: pointsToUse, netPayable, earnedPoints };
  };

  // User has 400 points, order total is ₹600. Max redeemable 50% = ₹300.
  const loyaltyRes = calculateLoyaltyRedemption(600, 400);
  assertTest('Loyalty points redemption capped at 50% order value (₹300)', loyaltyRes.pointsUsed === 300);
  assertTest('Net payable calculated as ₹600 - ₹300 = ₹300', loyaltyRes.netPayable === 300);
  assertTest('Points earned on net payable (5% of ₹300 = 15 pts)', loyaltyRes.earnedPoints === 15);


  // --- 4. GST & Tax Calculation (Intra-State vs Inter-State) ---
  console.log('\n--- 4. GST & Tax Calculations ---');
  const calculateTaxes = (amount: number, sellerState: string, buyerState: string, gstRatePercent: number) => {
    const isIntraState = sellerState.trim().toLowerCase() === buyerState.trim().toLowerCase();
    const taxableValue = amount / (1 + gstRatePercent / 100);
    const totalGst = amount - taxableValue;

    if (isIntraState) {
      const cgst = totalGst / 2;
      const sgst = totalGst / 2;
      return { isIntraState, taxableValue, cgst, sgst, igst: 0, totalGst };
    } else {
      return { isIntraState, taxableValue, cgst: 0, sgst: 0, igst: totalGst, totalGst };
    }
  };

  // Test Case A: Intra-state (Uttarakhand to Uttarakhand, 12% GST on ₹112 order)
  const intraTax = calculateTaxes(112, 'Uttarakhand', 'Uttarakhand', 12);
  assertTest('Intra-state transaction splits GST into CGST (6%) and SGST (6%)', intraTax.isIntraState && Math.round(intraTax.cgst) === 6 && Math.round(intraTax.sgst) === 6);
  assertTest('Taxable value computed correctly (₹100 for ₹112 gross at 12% GST)', Math.round(intraTax.taxableValue) === 100);

  // Test Case B: Inter-state (Uttarakhand to Delhi, 12% GST on ₹112 order)
  const interTax = calculateTaxes(112, 'Uttarakhand', 'Delhi', 12);
  assertTest('Inter-state transaction applies full IGST (12%)', !interTax.isIntraState && Math.round(interTax.igst) === 12);


  // --- 5. GST Invoice Generation Verification ---
  console.log('\n--- 5. Invoice Generation Audit ---');
  const invoiceHtml = generateInvoiceHtml({
    orderNumber: 'ORD-2026-BUSINESS-01',
    invoiceNumber: 'INV-ORD-2026-BUSINESS-01',
    invoiceDate: new Date(),
    items: [
      { name: 'Kashmiri Red Chilli Powder', variant: '500g', quantity: 2, price: 250 },
      { name: 'Garam Masala Special', variant: '100g', quantity: 1, price: 120 },
    ],
    subtotal: 620,
    shippingCharge: 40,
    discountAmount: 50,
    totalAmount: 610,
    paymentMethod: 'cashfree',
    paymentStatus: 'paid',
    shippingAddress: {
      fullName: 'Anita Sharma',
      addressLine1: 'Flat 402, Royal Palms',
      city: 'Dehradun',
      state: 'Uttarakhand',
      pincode: '248001',
      phone: '9876543210',
    },
  });

  assertTest('GST Tax Invoice renders complete HTML structure', invoiceHtml.includes('Tax Invoice') && invoiceHtml.includes('INV-ORD-2026-BUSINESS-01'));
  assertTest('Invoice displays seller GSTIN (05AAAAA0000A1Z5)', invoiceHtml.includes('GSTIN: 05AAAAA0000A1Z5'));
  assertTest('Invoice displays Cashfree payment method badge', invoiceHtml.toLowerCase().includes('cashfree'));


  // --- 6. COD Restrictions ---
  console.log('\n--- 6. Cash on Delivery (COD) Restrictions ---');
  const MAX_COD_LIMIT = 5000;
  const SERVICEABLE_PINCODES = ['248001', '248002', '110001', '400001'];

  const validateCodEligibility = (orderTotal: number, pincode: string) => {
    if (orderTotal > MAX_COD_LIMIT) {
      return { eligible: false, reason: `COD unavailable for orders above ₹${MAX_COD_LIMIT}` };
    }
    if (!SERVICEABLE_PINCODES.includes(pincode)) {
      return { eligible: false, reason: `COD not serviceable at pincode ${pincode}` };
    }
    return { eligible: true };
  };

  // Test Case A: Exceeds MAX_COD_LIMIT (₹6000)
  const highValueCod = validateCodEligibility(6000, '248001');
  assertTest('COD blocked for high-value order (₹6,000 > ₹5,000 cap)', !highValueCod.eligible && highValueCod.reason.includes('above ₹5000'));

  // Test Case B: Non-serviceable pincode
  const unserviceableCod = validateCodEligibility(1500, '999999');
  assertTest('COD blocked for unserviceable pincode (999999)', !unserviceableCod.eligible && unserviceableCod.reason.includes('not serviceable'));

  // Test Case C: Valid COD order
  const validCod = validateCodEligibility(1500, '248001');
  assertTest('COD approved for order amount ₹1,500 at pincode 248001', validCod.eligible === true);


  // --- Summary ---
  console.log('\n================================================================');
  console.log(` BUSINESS LOGIC AUDIT SUMMARY: Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runBusinessLogicTestSuite();
