import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
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
export declare const createProduct: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update product (Admin only)
 */
export declare const updateProduct: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete product (Admin only)
 */
export declare const deleteProduct: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get featured/bestseller products
 */
export declare const getFeaturedProducts: (req: any, res: Response) => Promise<void>;
/**
 * Upload product image
 */
export declare const uploadImage: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=productController.d.ts.map