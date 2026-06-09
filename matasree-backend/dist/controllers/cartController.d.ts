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
export declare const removeFromCart: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Clear entire cart
 */
export declare const clearCart: (req: any, res: Response) => Promise<void>;
//# sourceMappingURL=cartController.d.ts.map