import { Router } from 'express';
import * as productController from '../controllers/productController';
import { verifyToken, verifyAdmin } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

// Public routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:id', productController.getProductById);

// Admin routes
router.post('/', verifyToken, verifyAdmin, upload.single('image'), productController.createProduct);
router.put('/:id', verifyToken, verifyAdmin, upload.single('image'), productController.updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, productController.deleteProduct);

// Image upload route
router.post('/upload/image', verifyToken, verifyAdmin, upload.single('image'), productController.uploadImage);

export default router;
