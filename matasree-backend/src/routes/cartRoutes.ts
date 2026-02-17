import { Router } from 'express';
import * as cartController from '../controllers/cartController';
import { verifyToken, verifyCustomer } from '../middleware/auth';

const router = Router();

// All cart routes require authentication
router.use(verifyToken);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/update', cartController.updateCartItem);
router.post('/remove', cartController.removeFromCart);
router.post('/clear', cartController.clearCart);

export default router;
