import { Router } from 'express';
import * as productController from '../controllers/productController';
import { verifyToken, verifyAdmin } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

// Public routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
// Search route must be registered before /:id to avoid route shadowing
router.get('/search', productController.searchProducts);
// Recently Viewed routes — must be registered before /:id to avoid route shadowing
router.get('/recently-viewed', verifyToken, productController.getRecentlyViewed);
router.post('/recently-viewed/:productId', verifyToken, productController.addToRecentlyViewed);
router.get('/:id', productController.getProductById);

// Admin routes
router.post('/', verifyToken, verifyAdmin, upload.single('image'), productController.createProduct);
router.put('/:id', verifyToken, verifyAdmin, upload.single('image'), productController.updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, productController.deleteProduct);

// Image upload route
router.post('/upload/image', verifyToken, verifyAdmin, upload.single('image'), productController.uploadImage);

export default router;
