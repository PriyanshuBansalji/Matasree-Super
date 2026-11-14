import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import * as adminProductController from '../controllers/adminProductController';
import { uploadImage } from '../controllers/productController';
import { verifyToken, verifyAdmin } from '../middleware/auth';
import { auditLogAction } from '../middleware/auditLogger';
import { cacheMiddleware, invalidateCachePattern } from '../middleware/cache';
import upload from '../middleware/upload';
import { optimizeProductImage } from '../middleware/imageOptimizer';

const router = Router();

// Invalidation middleware for Banners
const invalidateBannersCache = (req: any, res: any, next: any) => {
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      await invalidateCachePattern('banners:*');
    }
  });
  next();
};

// Invalidation middleware for Recipes
const invalidateRecipesCache = (req: any, res: any, next: any) => {
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      await invalidateCachePattern('recipes:*');
    }
  });
  next();
};

// ──────────────────────────────────────────────────────────────
// PUBLIC routes (no authentication required) — MUST be before
// the router.use(verifyToken, verifyAdmin) middleware below.
// ──────────────────────────────────────────────────────────────

// Recipes – public read (Cached for 15 minutes)
router.get('/recipes', cacheMiddleware(900, 'recipes'), adminController.getRecipes);

// Seasonal Banners – public read (Cached for 30 minutes)
router.get('/banners', cacheMiddleware(1800, 'banners'), adminController.getSeasonalBanners);

// ──────────────────────────────────────────────────────────────
// All routes below require admin authentication
// ──────────────────────────────────────────────────────────────
router.use(verifyToken, verifyAdmin);

// Admin File Uploads
router.post('/upload', upload.single('image'), optimizeProductImage, uploadImage);

// Dashboard & Users
router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', auditLogAction('UPDATE_USER_ROLE', 'User'), adminController.updateUserRole);
router.delete('/users/:id', auditLogAction('DELETE_USER', 'User'), adminController.deleteUser);

// Analytics
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/payments', adminController.getPaymentSummary);
router.get('/products/low-stock', adminController.getLowStockProducts);
router.get('/products/top-selling', adminController.getTopSellingProducts);
router.get('/coupons/analytics', adminController.getCouponAnalytics);

// Admin Product Management (Shopify-Style System)
// Note: Fixed-path routes MUST be defined BEFORE parameterized routes (e.g., /:id)
router.get('/products/export', adminProductController.exportProducts);
router.post('/products/import', adminProductController.importProducts);
router.get('/products/search-picker', adminProductController.searchPickerProducts);
router.post('/products/bulk', auditLogAction('BULK_PRODUCT_ACTION', 'Product'), adminProductController.bulkOperation);

router.get('/products', adminProductController.listProducts);
router.post('/products', auditLogAction('CREATE_PRODUCT', 'Product'), adminProductController.createProduct);
router.get('/products/:id', adminProductController.getProduct);
router.put('/products/:id', auditLogAction('UPDATE_PRODUCT', 'Product'), adminProductController.updateProduct);
router.delete('/products/:id', auditLogAction('DELETE_PRODUCT', 'Product'), adminProductController.deleteProduct);
router.patch('/products/:id/status', auditLogAction('UPDATE_PRODUCT_STATUS', 'Product'), adminProductController.updateProductStatus);
router.post('/products/:id/duplicate', auditLogAction('DUPLICATE_PRODUCT', 'Product'), adminProductController.duplicateProduct);
router.get('/products/:id/inventory', adminProductController.getInventory);
router.put('/products/:id/variants/:variantId/stock', auditLogAction('ADJUST_VARIANT_STOCK', 'Product'), adminProductController.adjustVariantStock);
router.get('/products/:id/inventory/history', adminProductController.getInventoryHistory);

// Cart abandonment config (Req 14.5)
router.get('/abandonment-config', adminController.getAbandonmentConfig as any);
router.put('/abandonment-config', auditLogAction('UPDATE_ABANDONMENT_CONFIG', 'Config'), adminController.updateAbandonmentConfig as any);

// Recipes – admin CRUD (Invalidates recipes cache)
router.post('/recipes', auditLogAction('CREATE_RECIPE', 'Recipe'), invalidateRecipesCache, adminController.createRecipe);
router.put('/recipes/:id', auditLogAction('UPDATE_RECIPE', 'Recipe'), invalidateRecipesCache, adminController.updateRecipe);
router.delete('/recipes/:id', auditLogAction('DELETE_RECIPE', 'Recipe'), invalidateRecipesCache, adminController.deleteRecipe);

// Seasonal Banners – admin CRUD (Invalidates banners cache)
router.post('/banners', auditLogAction('CREATE_BANNER', 'Banner'), invalidateBannersCache, adminController.createBanner);
router.put('/banners/:id', auditLogAction('UPDATE_BANNER', 'Banner'), invalidateBannersCache, adminController.updateBanner);
router.delete('/banners/:id', auditLogAction('DELETE_BANNER', 'Banner'), invalidateBannersCache, adminController.deleteBanner);

export default router;
