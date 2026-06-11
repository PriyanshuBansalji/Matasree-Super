import { Response } from 'express';
/**
 * Get all products with filtering and search
 */
export declare const getProducts: (req: any, res: Response) => Promise<void>;
/**
 * Get product by ID
 */
export declare const getProductById: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create product (Admin only)
 */
export declare const createProduct: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update product (Admin only)
 */
export declare const updateProduct: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete product (Admin only)
 */
export declare const deleteProduct: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get featured/bestseller products
 */
export declare const getFeaturedProducts: (req: any, res: Response) => Promise<void>;
/**
 * Autocomplete search — GET /api/products/search?q=&limit=10
 * Requirements: 1.1, 1.2, 1.4, 1.6, 1.7
 */
export declare const searchProducts: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get recently viewed products — GET /api/products/recently-viewed
 * Returns ≤ 10 products ordered by most-recent viewedAt, omitting deleted products.
 * Requirements: 4.1, 4.4, 4.5
 */
export declare const getRecentlyViewed: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Add product to recently viewed — POST /api/products/recently-viewed/:productId
 * Upserts product into a sliding window of 10 (most recent).
 * Requirements: 4.1, 4.4, 4.5
 */
export declare const addToRecentlyViewed: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Upload product image
 */
export declare const uploadImage: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=productController.d.ts.map