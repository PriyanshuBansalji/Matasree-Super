import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
/**
 * Get all categories
 */
export declare const getCategories: (req: any, res: Response) => Promise<void>;
/**
 * Get category by ID
 */
export declare const getCategoryById: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create category (Admin only)
 */
export declare const createCategory: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update category (Admin only)
 */
export declare const updateCategory: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete category (Admin only)
 */
export declare const deleteCategory: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=categoryController.d.ts.map