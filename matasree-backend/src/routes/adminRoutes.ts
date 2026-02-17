import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { verifyToken, verifyAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require admin authentication
router.use(verifyToken, verifyAdmin);

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/payments', adminController.getPaymentSummary);

export default router;
