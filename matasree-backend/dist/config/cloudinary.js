"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptimizedUrl = exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
/**
 * Cloudinary Configuration
 * Cloud-based image storage replacing local uploads
 * Includes upload, delete, and transform utilities
 */
const cloudinary_1 = require("cloudinary");
const logger_1 = __importDefault(require("./logger"));
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
/**
 * Upload an image buffer to Cloudinary
 * @param fileBuffer - The file buffer to upload
 * @param folder - The Cloudinary folder to store in
 * @returns Upload result with URL and public_id
 */
const uploadToCloudinary = async (fileBuffer, folder = 'matasree/products') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            resource_type: 'image',
            transformation: [
                { width: 800, height: 800, crop: 'limit', quality: 'auto:good' },
                { fetch_format: 'auto' }, // Auto WebP/AVIF based on browser
            ],
        }, (error, result) => {
            if (error) {
                logger_1.default.error('Cloudinary upload error:', error);
                reject(error);
            }
            else if (result) {
                resolve(result);
            }
        });
        uploadStream.end(fileBuffer);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
/**
 * Delete an image from Cloudinary by public_id
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary_1.v2.uploader.destroy(publicId);
        logger_1.default.info(`Deleted image from Cloudinary: ${publicId}`);
    }
    catch (error) {
        logger_1.default.error('Cloudinary delete error:', error);
        throw error;
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
/**
 * Generate optimized URL for an existing Cloudinary image
 */
const getOptimizedUrl = (publicId, options) => {
    return cloudinary_1.v2.url(publicId, {
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
exports.getOptimizedUrl = getOptimizedUrl;
exports.default = cloudinary_1.v2;
//# sourceMappingURL=cloudinary.js.map