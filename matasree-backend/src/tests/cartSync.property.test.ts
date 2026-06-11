/**
 * Property-Based Tests for Cart Sync Algorithm
 *
 * Uses fast-check to verify universal properties of the cart sync
 * reconciliation logic defined in the CartSync algorithm (design.md).
 *
 * The pure syncCart function is implemented inline — no DB calls — so
 * these tests validate the algorithm's correctness in isolation.
 *
 * Validates: Requirements 24.1, 24.2, 24.3
 */

import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Pure syncCart implementation (mirrors cartController.ts logic, no DB)
// ---------------------------------------------------------------------------

interface ClientItem {
  productId: string;
  quantity: number;
  clientPrice: number;
}

interface LiveProduct {
  _id: string;
  price: number;
  stock: number;
}

interface SyncedItem {
  productId: string;
  quantity: number;
  price: number;
}

interface PriceDiff {
  productId: string;
  oldPrice: number;
  newPrice: number;
}

interface SyncResult {
  syncedItems: SyncedItem[];
  priceDiffs: PriceDiff[];
  removedItems: ClientItem[];
}

function syncCart(
  clientItems: ClientItem[],
  liveProductsMap: Map<string, LiveProduct>,
): SyncResult {
  const syncedItems: SyncedItem[] = [];
  const priceDiffs: PriceDiff[] = [];
  const removedItems: ClientItem[] = [];

  for (const clientItem of clientItems) {
    const live = liveProductsMap.get(clientItem.productId);

    // Product missing or out of stock → remove
    if (!live || live.stock === 0) {
      removedItems.push(clientItem);
      continue;
    }

    // Record price difference
    if (live.price !== clientItem.clientPrice) {
      priceDiffs.push({
        productId: clientItem.productId,
        oldPrice: clientItem.clientPrice,
        newPrice: live.price,
      });
    }

    // Cap quantity at stock; always use live price
    syncedItems.push({
      productId: live._id,
      quantity: Math.min(clientItem.quantity, live.stock),
      price: live.price,
    });
  }

  return { syncedItems, priceDiffs, removedItems };
}

// ---------------------------------------------------------------------------
// Arbitraries (shared generators)
// ---------------------------------------------------------------------------

/** Generates a non-empty alphanumeric product ID string */
const productIdArb = fc.hexaString({ minLength: 8, maxLength: 16 });

/** Generates a client cart item */
const clientItemArb = fc.record({
  productId: productIdArb,
  quantity: fc.integer({ min: 1, max: 100 }),
  clientPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
});

// ---------------------------------------------------------------------------
// Property 5: Cart Sync Price Integrity
// Validates: Requirements 24.1, 24.2
// ---------------------------------------------------------------------------
describe('Cart Sync Price Integrity', () => {
  it('every syncedItem uses the live product price, not the client price', () => {
    /**
     * **Validates: Requirements 24.1, 24.2**
     *
     * For any array of client cart items paired with a live product map
     * (where live prices may differ from client prices), every item that
     * makes it into syncedItems must carry the live product's price —
     * never the stale client-side price.
     */
    fc.assert(
      fc.property(
        fc.array(clientItemArb, { minLength: 0, maxLength: 20 }),
        (clientItems) => {
          // Build a live map: every product has stock > 0 but a DIFFERENT price
          // (live price = clientPrice + 1) to make the price-integrity check
          // as visible as possible.
          const liveMap = new Map<string, LiveProduct>();
          for (const item of clientItems) {
            if (!liveMap.has(item.productId)) {
              liveMap.set(item.productId, {
                _id: item.productId,
                price: item.clientPrice + 1, // deliberately different
                stock: 10,
              });
            }
          }

          const { syncedItems } = syncCart(clientItems, liveMap);

          // Every synced item's price must equal the live product price
          return syncedItems.every((synced) => {
            const live = liveMap.get(synced.productId);
            return live !== undefined && synced.price === live.price;
          });
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Cart Sync Stock Guard
// Validates: Requirements 24.3
// ---------------------------------------------------------------------------
describe('Cart Sync Stock Guard', () => {
  it('out-of-stock products never appear in syncedItems and always land in removedItems', () => {
    /**
     * **Validates: Requirements 24.3**
     *
     * For any client cart that contains a mix of in-stock and out-of-stock
     * products, no out-of-stock product may appear in syncedItems, and
     * every out-of-stock product must appear in removedItems.
     */
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            productId: productIdArb,
            quantity: fc.integer({ min: 1, max: 100 }),
            clientPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
            liveStock: fc.integer({ min: 0, max: 50 }), // 0 = out of stock
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (rawItems) => {
          // Deduplicate by productId so the live map is deterministic
          const seen = new Set<string>();
          const clientItems: ClientItem[] = [];
          const liveMap = new Map<string, LiveProduct>();

          for (const raw of rawItems) {
            if (seen.has(raw.productId)) continue;
            seen.add(raw.productId);

            clientItems.push({
              productId: raw.productId,
              quantity: raw.quantity,
              clientPrice: raw.clientPrice,
            });

            liveMap.set(raw.productId, {
              _id: raw.productId,
              price: raw.clientPrice,
              stock: raw.liveStock,
            });
          }

          const { syncedItems, removedItems } = syncCart(clientItems, liveMap);

          // Identify all product IDs that are out of stock in the live map
          const outOfStockIds = new Set(
            clientItems
              .map((ci) => ci.productId)
              .filter((id) => {
                const live = liveMap.get(id);
                return live !== undefined && live.stock === 0;
              })
          );

          // Guard 1: no out-of-stock product appears in syncedItems
          const noneInSynced = syncedItems.every(
            (s) => !outOfStockIds.has(s.productId)
          );

          // Guard 2: every out-of-stock product appears in removedItems
          const removedProductIds = new Set(removedItems.map((r) => r.productId));
          const allInRemoved = [...outOfStockIds].every((id) =>
            removedProductIds.has(id)
          );

          return noneInSynced && allInRemoved;
        }
      )
    );
  });
});
