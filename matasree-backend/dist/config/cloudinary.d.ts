/**
 * Cloudinary Configuration
 * Cloud-based image storage replacing local uploads
 * Includes upload, delete, and transform utilities
 */
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
/**
 * Upload an image buffer to Cloudinary
 * @param fileBuffer - The file buffer to upload
 * @param folder - The Cloudinary folder to store in
 * @returns Upload result with URL and public_id
 */
export declare const uploadToCloudinary: (fileBuffer: Buffer, folder?: string) => Promise<UploadApiResponse>;
/**
 * Delete an image from Cloudinary by public_id
 */
export declare const deleteFromCloudinary: (publicId: string) => Promise<void>;
/**
 * Generate optimized URL for an existing Cloudinary image
 */
export declare const getOptimizedUrl: (publicId: string, options?: {
    width?: number;
    height?: number;
    crop?: string;
}) => string;
export default cloudinary;
//# sourceMappingURL=cloudinary.d.ts.map