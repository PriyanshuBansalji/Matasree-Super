import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { verifyToken, verifyAdmin } from '../middleware/auth';

const router = Router();

// Customer routes
router.post('/', verifyToken, orderController.createOrder);
router.post('/verify-payment', verifyToken, orderController.verifyPayment);
router.get('/my-orders', verifyToken, orderController.getOrders);
router.get('/:id', verifyToken, orderController.getOrderById);
router.get('/:id/invoice', verifyToken, orderController.downloadInvoice);
router.put('/:id/cancel', verifyToken, orderController.cancelOrder);

// Admin routes
router.get('/', verifyToken, verifyAdmin, orderController.getAllOrders);
router.put('/:id/status', verifyToken, verifyAdmin, orderController.updateOrderStatus);
router.post('/:id/refund', verifyToken, verifyAdmin, orderController.processRefund);

export default router;
