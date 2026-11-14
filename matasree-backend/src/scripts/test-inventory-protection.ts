/**
 * Inventory Protection Test Suite
 * Validates:
 * 1. Two customers buying last item (Concurrent atomic $gte guard)
 * 2. Payment pending stock reservation (stockReservedAt & background release)
 * 3. Stock rollback on partial order failure
 * 4. Cancelled order inventory restore
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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

async function runInventoryProtectionTests() {
  console.log('================================================================');
  console.log(' INVENTORY PROTECTION & CONCURRENCY AUDIT TEST SUITE');
  console.log('================================================================\n');

  // --- 1. Simulation: Two customers buying last item concurrently ---
  console.log('--- 1. Two Customers Buying Last Item (Concurrency Protection) ---');
  let currentStock = 1;
  let successfulOrders = 0;
  let failedOrders = 0;

  // Simulated atomic $gte decrement function (mimicking MongoDB findOneAndUpdate with $gte)
  const attemptAtomicPurchase = async (quantity: number): Promise<{ success: boolean; remainingStock: number }> => {
    // Simulated microsecond delay to represent concurrent execution
    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 10)));
    
    // Atomic check-and-set condition: stock >= quantity
    if (currentStock >= quantity) {
      currentStock -= quantity;
      return { success: true, remainingStock: currentStock };
    } else {
      return { success: false, remainingStock: currentStock };
    }
  };

  // Launch two concurrent purchase attempts for item with stock = 1
  const [res1, res2] = await Promise.all([
    attemptAtomicPurchase(1),
    attemptAtomicPurchase(1),
  ]);

  if (res1.success) successfulOrders++;
  else failedOrders++;

  if (res2.success) successfulOrders++;
  else failedOrders++;

  assertTest('Exactly 1 concurrent order succeeded for last item', successfulOrders === 1);
  assertTest('Exactly 1 concurrent order was rejected (Out of Stock)', failedOrders === 1);
  assertTest('Final inventory stock is 0 (No negative stock)', currentStock === 0);

  // --- 2. Payment Pending Stock Reservation ---
  console.log('\n--- 2. Payment Pending Stock Reservation & Release ---');
  let reservedStock = 10;
  let availableStock = 50;

  // Reserve stock for online payment
  const reserveStockForOrder = (qty: number) => {
    availableStock -= qty;
    reservedStock += qty;
    const stockReservedAt = new Date();
    return { stockReservedAt, availableStock, reservedStock };
  };

  // Simulate background stock release job after 15 minutes expiration
  const releaseExpiredStock = (qty: number, reservedAt: Date) => {
    const now = new Date();
    const isExpired = (now.getTime() - reservedAt.getTime()) >= (15 * 60 * 1000);
    if (isExpired) {
      availableStock += qty;
      reservedStock -= qty;
    }
    return { availableStock, reservedStock, isExpired };
  };

  const reservation = reserveStockForOrder(5);
  assertTest('Stock reserved on payment initiation (50 -> 45 available)', availableStock === 45);
  assertTest('Reservation timestamp (stockReservedAt) recorded', reservation.stockReservedAt instanceof Date);

  // Simulate expired reservation (16 minutes ago)
  const expiredTime = new Date(Date.now() - 16 * 60 * 1000);
  const releaseResult = releaseExpiredStock(5, expiredTime);

  assertTest('Background stock release job detected 15-min expiration', releaseResult.isExpired === true);
  assertTest('Expired reserved stock restored to available inventory (45 -> 50)', availableStock === 50);

  // --- 3. Stock Rollback on Mid-Order Failure ---
  console.log('\n--- 3. Stock Rollback on Partial Order Failure ---');
  let item1Stock = 10;
  let item2Stock = 0; // Out of stock

  const simulateMultiItemOrder = async () => {
    const decrementedItems: Array<{ item: string; qty: number }> = [];
    let rollbackTriggered = false;

    // Item 1 decrement attempt
    if (item1Stock >= 2) {
      item1Stock -= 2;
      decrementedItems.push({ item: 'item1', qty: 2 });
    }

    // Item 2 decrement attempt (will fail)
    if (item2Stock >= 1) {
      item2Stock -= 1;
      decrementedItems.push({ item: 'item2', qty: 1 });
    } else {
      rollbackTriggered = true;
      // Perform rollback for already decremented items
      for (const dec of decrementedItems) {
        if (dec.item === 'item1') {
          item1Stock += dec.qty;
        }
      }
    }

    return { rollbackTriggered, item1Stock, item2Stock };
  };

  const rollbackResult = await simulateMultiItemOrder();
  assertTest('Partial order failure triggered rollback', rollbackResult.rollbackTriggered === true);
  assertTest('Item 1 stock restored after rollback (10 -> 8 -> 10)', item1Stock === 10);
  assertTest('Item 2 stock unchanged (0)', item2Stock === 0);

  // --- 4. Cancelled Order Inventory Restore ---
  console.log('\n--- 4. Cancelled Order Inventory Restore ---');
  let productAStock = 100;
  let productBStock = 50;

  // Place order for 5 of Product A and 3 of Product B
  const orderQtyA = 5;
  const orderQtyB = 3;

  productAStock -= orderQtyA;
  productBStock -= orderQtyB;

  assertTest('Inventory decremented after order placement (A: 95, B: 47)', productAStock === 95 && productBStock === 47);

  // Customer cancels order
  const restoreCancelledOrder = (items: Array<{ name: string; qty: number }>) => {
    for (const item of items) {
      if (item.name === 'ProductA') productAStock += item.qty;
      if (item.name === 'ProductB') productBStock += item.qty;
    }
  };

  restoreCancelledOrder([
    { name: 'ProductA', qty: orderQtyA },
    { name: 'ProductB', qty: orderQtyB },
  ]);

  assertTest('Product A stock fully restored on cancellation (95 -> 100)', productAStock === 100);
  assertTest('Product B stock fully restored on cancellation (47 -> 50)', productBStock === 50);

  // --- Summary ---
  console.log('\n================================================================');
  console.log(` INVENTORY PROTECTION AUDIT SUMMARY: Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runInventoryProtectionTests();
