import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
/**
 * Get user's cart
 */
export declare const getCart: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Add item to cart
 */
export declare const addToCart: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update cart item quantity
 */
export declare const updateCartItem: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Remove item from cart
 */
export declare const removeFromCart: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Clear entire cart
 */
export declare const clearCart: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=cartController.d.ts.map