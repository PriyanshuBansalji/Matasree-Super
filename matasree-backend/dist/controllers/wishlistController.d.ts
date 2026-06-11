/**
 * Wishlist Controller
 * Handles get, add, and remove operations for a user's wishlist.
 * Each user owns exactly one Wishlist document (upserted on first add).
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
import { Response } from 'express';
/**
 * GET /api/wishlist
 * Returns the authenticated user's wishlist with each product populated
 * (name, price, image, stock). Stale references (deleted products) are
 * silently removed from the DB document before responding.
 *
 * Requirement 3.1
 */
export declare const getWishlist: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/wishlist/:productId
 * Adds a product to the wishlist.
 * - 400 if productId is not a valid ObjectId
 * - 409 if the product is already in the wishlist
 * - 400 if the wishlist has reached the 100-item cap
 * - 201 on success
 *
 * Requirements 3.2, 3.3, 3.4
 */
export declare const addToWishlist: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * DELETE /api/wishlist/:productId
 * Removes a product from the wishlist.
 * - 404 if the product is not in the wishlist
 * - 200 on success
 *
 * Requirements 3.6, 3.7
 */
export declare const removeFromWishlist: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=wishlistController.d.ts.map