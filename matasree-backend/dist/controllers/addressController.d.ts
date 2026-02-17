import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
/**
 * Get user's addresses
 */
export declare const getAddresses: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get address by ID
 */
export declare const getAddressById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create address
 */
export declare const createAddress: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update address
 */
export declare const updateAddress: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete address
 */
export declare const deleteAddress: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Set default address
 */
export declare const setDefaultAddress: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=addressController.d.ts.map