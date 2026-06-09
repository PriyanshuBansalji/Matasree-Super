import { Response } from 'express';
/**
 * Get user's addresses
 */
export declare const getAddresses: (req: any, res: Response) => Promise<void>;
/**
 * Get address by ID
 */
export declare const getAddressById: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create address
 */
export declare const createAddress: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update address
 */
export declare const updateAddress: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete address
 */
export declare const deleteAddress: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Set default address
 */
export declare const setDefaultAddress: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=addressController.d.ts.map