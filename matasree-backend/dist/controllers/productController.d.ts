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
 */
export declare const searchProducts: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get recently viewed products
 */
export declare const getRecentlyViewed: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Add product to recently viewed
 */
export declare const addToRecentlyViewed: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Upload product image
 */
export declare const uploadImage: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=productController.d.ts.map