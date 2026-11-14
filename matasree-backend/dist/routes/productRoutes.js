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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController = __importStar(require("../controllers/productController"));
const auth_1 = require("../middleware/auth");
const cache_1 = require("../middleware/cache");
const upload_1 = __importDefault(require("../middleware/upload"));
const imageOptimizer_1 = require("../middleware/imageOptimizer");
const router = (0, express_1.Router)();
// Invalidation middleware for state-changing product routes
const invalidateProductsCache = (req, res, next) => {
    res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            await (0, cache_1.invalidateCachePattern)('products:*');
        }
    });
    next();
};
// Public routes (Cached for 5 minutes)
router.get('/', (0, cache_1.cacheMiddleware)(300, 'products'), productController.getProducts);
router.get('/featured', (0, cache_1.cacheMiddleware)(300, 'products'), productController.getFeaturedProducts);
// Search route must be registered before /:id to avoid route shadowing
router.get('/search', productController.searchProducts);
// Recently Viewed routes — must be registered before /:id to avoid route shadowing
router.get('/recently-viewed', auth_1.verifyToken, productController.getRecentlyViewed);
router.post('/recently-viewed/:productId', auth_1.verifyToken, productController.addToRecentlyViewed);
router.get('/:id', productController.getProductById);
// Admin routes (Optimizes image and invalidates products cache on success)
router.post('/', auth_1.verifyToken, auth_1.verifyAdmin, upload_1.default.single('image'), imageOptimizer_1.optimizeProductImage, invalidateProductsCache, productController.createProduct);
router.put('/:id', auth_1.verifyToken, auth_1.verifyAdmin, upload_1.default.single('image'), imageOptimizer_1.optimizeProductImage, invalidateProductsCache, productController.updateProduct);
router.delete('/:id', auth_1.verifyToken, auth_1.verifyAdmin, invalidateProductsCache, productController.deleteProduct);
// Image upload route
router.post('/upload/image', auth_1.verifyToken, auth_1.verifyAdmin, upload_1.default.single('image'), imageOptimizer_1.optimizeProductImage, productController.uploadImage);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map