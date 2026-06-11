"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Wishlist Routes
 * All routes are protected by verifyToken (401 on unauthenticated access).
 *
 * GET    /api/wishlist              — get populated wishlist
 * POST   /api/wishlist/:productId   — add product (409 duplicate, 400 cap)
 * DELETE /api/wishlist/:productId   — remove product (404 if absent)
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const wishlistController_1 = require("../controllers/wishlistController");
const router = (0, express_1.Router)();
// All wishlist routes require authentication
router.use(auth_1.verifyToken);
router.get('/', wishlistController_1.getWishlist);
router.post('/:productId', wishlistController_1.addToWishlist);
router.delete('/:productId', wishlistController_1.removeFromWishlist);
exports.default = router;
//# sourceMappingURL=wishlistRoutes.js.map