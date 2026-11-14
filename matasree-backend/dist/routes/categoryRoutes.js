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
const categoryController = __importStar(require("../controllers/categoryController"));
const auth_1 = require("../middleware/auth");
const cache_1 = require("../middleware/cache");
const router = (0, express_1.Router)();
// Invalidation middleware for category modifications
const invalidateCategoriesCache = (req, res, next) => {
    res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            await (0, cache_1.invalidateCachePattern)('categories:*');
        }
    });
    next();
};
// Public routes (Cached for 10 minutes)
router.get('/', (0, cache_1.cacheMiddleware)(600, 'categories'), categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
// Admin routes (Invalidates categories cache on success)
router.post('/', auth_1.verifyToken, auth_1.verifyAdmin, invalidateCategoriesCache, categoryController.createCategory);
router.put('/:id', auth_1.verifyToken, auth_1.verifyAdmin, invalidateCategoriesCache, categoryController.updateCategory);
router.delete('/:id', auth_1.verifyToken, auth_1.verifyAdmin, invalidateCategoriesCache, categoryController.deleteCategory);
exports.default = router;
//# sourceMappingURL=categoryRoutes.js.map