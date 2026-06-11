/**
 * Cloudinary Configuration
 * Cloud-based image storage replacing local uploads
 * Includes upload, delete, and transform utilities
 */
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import logger from './logger';

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? '';
const apiKey = process.env.CLOUDINARY_API_KEY ?? '';
const apiSecret = process.env.CLOUDINARY_API_SECRET ?? '';

if (!cloudName || !apiKey || !apiSecret) {
  logger.warn('⚠️  One or more Cloudinary credentials are missing. Image uploads may fail.');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

/**
 * Upload an image buffer to Cloudinary
 * @param fileBuffer - The file buffer to upload
 * @param folder - The Cloudinary folder to store in
 * @returns Upload result with URL and public_id
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = 'matasree/products'
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit', quality: 'auto:good' },
          { fetch_format: 'auto' }, // Auto WebP/AVIF based on browser
        ],
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete an image from Cloudinary by public_id
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Generate optimized URL for an existing Cloudinary image
 */
export const getOptimizedUrl = (publicId: string, options?: {
  width?: number;
  height?: number;
  crop?: string;
}): string => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width: options?.width || 400,
        height: options?.height || 400,
        crop: options?.crop || 'fill',
        quality: 'auto',
        fetch_format: 'auto',
      },
    ],
  });
};

export default cloudinary;
