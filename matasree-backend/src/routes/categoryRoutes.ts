import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import { verifyToken, verifyAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin routes
router.post('/', verifyToken, verifyAdmin, categoryController.createCategory);
router.put('/:id', verifyToken, verifyAdmin, categoryController.updateCategory);
router.delete('/:id', verifyToken, verifyAdmin, categoryController.deleteCategory);

export default router;
