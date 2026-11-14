"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController = __importStar(require("../controllers/adminController"));
const adminProductController = __importStar(require("../controllers/adminProductController"));
const auth_1 = require("../middleware/auth");
const auditLogger_1 = require("../middleware/auditLogger");
const cache_1 = require("../middleware/cache");
const router = (0, express_1.Router)();
// Invalidation middleware for Banners
const invalidateBannersCache = (req, res, next) => {
    res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            await (0, cache_1.invalidateCachePattern)('banners:*');
        }
    });
    next();
};
// Invalidation middleware for Recipes
const invalidateRecipesCache = (req, res, next) => {
    res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            await (0, cache_1.invalidateCachePattern)('recipes:*');
        }
    });
    next();
};
// ──────────────────────────────────────────────────────────────
// PUBLIC routes (no authentication required) — MUST be before
// the router.use(verifyToken, verifyAdmin) middleware below.
// ──────────────────────────────────────────────────────────────
// Recipes – public read (Cached for 15 minutes)
router.get('/recipes', (0, cache_1.cacheMiddleware)(900, 'recipes'), adminController.getRecipes);
// Seasonal Banners – public read (Cached for 30 minutes)
router.get('/banners', (0, cache_1.cacheMiddleware)(1800, 'banners'), adminController.getSeasonalBanners);
// ──────────────────────────────────────────────────────────────
// All routes below require admin authentication
// ──────────────────────────────────────────────────────────────
router.use(auth_1.verifyToken, auth_1.verifyAdmin);
// Dashboard & Users
router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', (0, auditLogger_1.auditLogAction)('UPDATE_USER_ROLE', 'User'), adminController.updateUserRole);
router.delete('/users/:id', (0, auditLogger_1.auditLogAction)('DELETE_USER', 'User'), adminController.deleteUser);
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
router.post('/products/bulk', (0, auditLogger_1.auditLogAction)('BULK_PRODUCT_ACTION', 'Product'), adminProductController.bulkOperation);
router.get('/products', adminProductController.listProducts);
router.post('/products', (0, auditLogger_1.auditLogAction)('CREATE_PRODUCT', 'Product'), adminProductController.createProduct);
router.get('/products/:id', adminProductController.getProduct);
router.put('/products/:id', (0, auditLogger_1.auditLogAction)('UPDATE_PRODUCT', 'Product'), adminProductController.updateProduct);
router.delete('/products/:id', (0, auditLogger_1.auditLogAction)('DELETE_PRODUCT', 'Product'), adminProductController.deleteProduct);
router.patch('/products/:id/status', (0, auditLogger_1.auditLogAction)('UPDATE_PRODUCT_STATUS', 'Product'), adminProductController.updateProductStatus);
router.post('/products/:id/duplicate', (0, auditLogger_1.auditLogAction)('DUPLICATE_PRODUCT', 'Product'), adminProductController.duplicateProduct);
router.get('/products/:id/inventory', adminProductController.getInventory);
router.put('/products/:id/variants/:variantId/stock', (0, auditLogger_1.auditLogAction)('ADJUST_VARIANT_STOCK', 'Product'), adminProductController.adjustVariantStock);
router.get('/products/:id/inventory/history', adminProductController.getInventoryHistory);
// Cart abandonment config (Req 14.5)
router.get('/abandonment-config', adminController.getAbandonmentConfig);
router.put('/abandonment-config', (0, auditLogger_1.auditLogAction)('UPDATE_ABANDONMENT_CONFIG', 'Config'), adminController.updateAbandonmentConfig);
// Recipes – admin CRUD (Invalidates recipes cache)
router.post('/recipes', (0, auditLogger_1.auditLogAction)('CREATE_RECIPE', 'Recipe'), invalidateRecipesCache, adminController.createRecipe);
router.put('/recipes/:id', (0, auditLogger_1.auditLogAction)('UPDATE_RECIPE', 'Recipe'), invalidateRecipesCache, adminController.updateRecipe);
router.delete('/recipes/:id', (0, auditLogger_1.auditLogAction)('DELETE_RECIPE', 'Recipe'), invalidateRecipesCache, adminController.deleteRecipe);
// Seasonal Banners – admin CRUD (Invalidates banners cache)
router.post('/banners', (0, auditLogger_1.auditLogAction)('CREATE_BANNER', 'Banner'), invalidateBannersCache, adminController.createBanner);
router.put('/banners/:id', (0, auditLogger_1.auditLogAction)('UPDATE_BANNER', 'Banner'), invalidateBannersCache, adminController.updateBanner);
router.delete('/banners/:id', (0, auditLogger_1.auditLogAction)('DELETE_BANNER', 'Banner'), invalidateBannersCache, adminController.deleteBanner);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map