import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import { verifyToken, verifyAdmin } from '../middleware/auth';
import { cacheMiddleware, invalidateCachePattern } from '../middleware/cache';

const router = Router();

// Invalidation middleware for category modifications
const invalidateCategoriesCache = (req: any, res: any, next: any) => {
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      await invalidateCachePattern('categories:*');
    }
  });
  next();
};

// Public routes (Cached for 10 minutes)
router.get('/', cacheMiddleware(600, 'categories'), categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin routes (Invalidates categories cache on success)
router.post('/', verifyToken, verifyAdmin, invalidateCategoriesCache, categoryController.createCategory);
router.put('/:id', verifyToken, verifyAdmin, invalidateCategoriesCache, categoryController.updateCategory);
router.delete('/:id', verifyToken, verifyAdmin, invalidateCategoriesCache, categoryController.deleteCategory);

export default router;
