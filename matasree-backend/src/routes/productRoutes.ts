import { Router } from 'express';
import * as productController from '../controllers/productController';
import { verifyToken, verifyAdmin } from '../middleware/auth';
import { cacheMiddleware, invalidateCachePattern } from '../middleware/cache';
import upload from '../middleware/upload';
import { optimizeProductImage } from '../middleware/imageOptimizer';

const router = Router();

// Invalidation middleware for state-changing product routes
const invalidateProductsCache = (req: any, res: any, next: any) => {
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      await invalidateCachePattern('products:*');
    }
  });
  next();
};

// Public routes (Cached for 5 minutes)
router.get('/', cacheMiddleware(300, 'products'), productController.getProducts);
router.get('/featured', cacheMiddleware(300, 'products'), productController.getFeaturedProducts);

// Search route must be registered before /:id to avoid route shadowing
router.get('/search', productController.searchProducts);

// Recently Viewed routes — must be registered before /:id to avoid route shadowing
router.get('/recently-viewed', verifyToken, productController.getRecentlyViewed);
router.post('/recently-viewed/:productId', verifyToken, productController.addToRecentlyViewed);
router.get('/:id', productController.getProductById);

// Admin routes (Optimizes image and invalidates products cache on success)
router.post('/', verifyToken, verifyAdmin, upload.single('image'), optimizeProductImage, invalidateProductsCache, productController.createProduct);
router.put('/:id', verifyToken, verifyAdmin, upload.single('image'), optimizeProductImage, invalidateProductsCache, productController.updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, invalidateProductsCache, productController.deleteProduct);

// Image upload route
router.post('/upload/image', verifyToken, verifyAdmin, upload.single('image'), optimizeProductImage, productController.uploadImage);

export default router;
