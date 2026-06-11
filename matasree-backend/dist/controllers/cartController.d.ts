import { Response } from 'express';
/**
 * Get user's cart
 */
export declare const getCart: (req: any, res: Response) => Promise<void>;
/**
 * Add item to cart
 */
export declare const addToCart: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update cart item quantity
 */
export declare const updateCartItem: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Remove item from cart
 */
export declare const removeFromCart: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Clear entire cart
 */
export declare const clearCart: (req: any, res: Response) => Promise<void>;
/**
 * Sync cart — POST /api/cart/sync
 *
 * Validates client cart items against live product prices and stock.
 * - Items whose product no longer exists or is out of stock are moved to removedItems.
 * - Items whose live price differs from the client price are recorded in priceDiffs.
 * - Quantities are capped at available stock.
 * - The reconciled cart is persisted to the database.
 *
 * Request body: { items: [{ productId: string, quantity: number, clientPrice: number }] }
 * Response:     { success: true, data: { syncedItems, priceDiffs, removedItems } }
 *
 * Requirements: 24.1, 24.2, 24.3, 24.4
 */
export declare const syncCart: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=cartController.d.ts.map