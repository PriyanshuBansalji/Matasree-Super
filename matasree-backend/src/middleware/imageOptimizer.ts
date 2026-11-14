import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import logger from '../config/logger';

/**
 * Middleware to optimize product image uploads using Sharp.
 * Converts any image to high-performance WebP format and resizes it to a max width of 800px.
 * Automatically deletes the original raw upload to save storage.
 */
export const optimizeProductImage = async (req: Request, res: Response, next: NextFunction) => {
  // Memory storage (Cloudinary flow) — no path available, skip sharp optimization
  if (!req.file || !req.file.path) {
    return next();
  }

  // Disk storage path exists — perform sharp optimization below

  const originalPath = req.file.path;
  const originalExtension = path.extname(req.file.originalname);
  const targetDir = path.dirname(originalPath);
  const baseName = path.basename(originalPath, originalExtension);
  const newFilename = `${baseName}.webp`;
  const targetPath = path.join(targetDir, newFilename);

  try {
    // Perform Sharp processing: resize, convert to webp (quality 80)
    await sharp(originalPath)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(targetPath);

    // Clean up original file if different
    if (originalPath !== targetPath) {
      fs.unlink(originalPath, (err) => {
        if (err) {
          logger.error('Failed to clean up original uploaded image:', err.message);
        }
      });
    }

    // Update multer request details
    req.file.filename = newFilename;
    req.file.path = targetPath;
    req.file.mimetype = 'image/webp';
    
    const stats = fs.statSync(targetPath);
    req.file.size = stats.size;

    next();
  } catch (error: any) {
    logger.error('Image optimization middleware failed:', error.message);
    next(); // Fallback to raw file if sharp fails
  }
};
