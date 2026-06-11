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
import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController';

const router = Router();

// All wishlist routes require authentication
router.use(verifyToken);

router.get('/', getWishlist);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;
