import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { verifyToken, verifyAdmin } from '../middleware/auth';

const router = Router();

// ──────────────────────────────────────────────────────────────
// PUBLIC routes (no authentication required) — MUST be before
// the router.use(verifyToken, verifyAdmin) middleware below.
// ──────────────────────────────────────────────────────────────

// Recipes – public read (Requirements: 9.2, 9.3, 16.3)
router.get('/recipes', adminController.getRecipes);

// Seasonal Banners – public read (Requirements: 9.4, 9.5, 17.1)
router.get('/banners', adminController.getSeasonalBanners);

// ──────────────────────────────────────────────────────────────
// All routes below require admin authentication
// ──────────────────────────────────────────────────────────────
router.use(verifyToken, verifyAdmin);

// Dashboard & Users
router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Analytics
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/payments', adminController.getPaymentSummary);

// Cart abandonment config (Req 14.5)
router.get('/abandonment-config', adminController.getAbandonmentConfig as any);
router.put('/abandonment-config', adminController.updateAbandonmentConfig as any);

// Recipes – admin CRUD
router.post('/recipes', adminController.createRecipe);
router.put('/recipes/:id', adminController.updateRecipe);
router.delete('/recipes/:id', adminController.deleteRecipe);

// Seasonal Banners – admin CRUD
router.post('/banners', adminController.createBanner);
router.put('/banners/:id', adminController.updateBanner);
router.delete('/banners/:id', adminController.deleteBanner);

export default router;
