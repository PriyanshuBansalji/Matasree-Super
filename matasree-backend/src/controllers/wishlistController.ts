/**
 * Wishlist Controller
 * Handles get, add, and remove operations for a user's wishlist.
 * Each user owns exactly one Wishlist document (upserted on first add).
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
import { Response } from 'express';
import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist';
import Product from '../models/Product';
import { ApiResponse } from '../utils/response';

const WISHLIST_CAP = 100;

/**
 * GET /api/wishlist
 * Returns the authenticated user's wishlist with each product populated
 * (name, price, image, stock). Stale references (deleted products) are
 * silently removed from the DB document before responding.
 *
 * Requirement 3.1
 */
export const getWishlist = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Fetch or create an empty wishlist for the user
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, items: [] });
      return res.status(200).json(
        new ApiResponse(true, 'Wishlist fetched', { items: [] })
      );
    }

    // Populate product fields; null entries indicate deleted products
    const populated = await Wishlist.findById(wishlist._id).populate({
      path: 'items.productId',
      select: 'name price image stock',
    });

    if (!populated) {
      return res.status(200).json(new ApiResponse(true, 'Wishlist fetched', { items: [] }));
    }

    // Separate valid items from stale refs (productId is null after populate)
    const staleIds: mongoose.Types.ObjectId[] = [];
    const validItems: Array<{
      productId: mongoose.Types.ObjectId;
      addedAt: Date;
      product: { name: string; price: number; image: string; stock: number };
    }> = [];

    for (const item of populated.items) {
      const product = item.productId as any;
      if (!product || typeof product !== 'object' || !product.name) {
        // Stale ref — collect original ObjectId for DB cleanup
        staleIds.push(item.productId as unknown as mongoose.Types.ObjectId);
      } else {
        validItems.push({
          productId: product._id,
          addedAt: item.addedAt,
          product: {
            name: product.name,
            price: product.price,
            image: product.image,
            stock: product.stock,
          },
        });
      }
    }

    // Remove stale product refs from DB (Req 3.5)
    if (staleIds.length > 0) {
      await Wishlist.updateOne(
        { userId },
        { $pull: { items: { productId: { $in: staleIds } } } }
      );
    }

    // Cap response at 100 items (Req 3.6)
    const cappedItems = validItems.slice(0, WISHLIST_CAP);

    return res.status(200).json(
      new ApiResponse(true, 'Wishlist fetched', { items: cappedItems })
    );
  } catch (error: any) {
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to fetch wishlist', null, 500));
  }
};

/**
 * POST /api/wishlist/:productId
 * Adds a product to the wishlist.
 * - 400 if productId is not a valid ObjectId
 * - 409 if the product is already in the wishlist
 * - 400 if the wishlist has reached the 100-item cap
 * - 201 on success
 *
 * Requirements 3.2, 3.3, 3.4
 */
export const addToWishlist = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    // Validate ObjectId (Req 3.2)
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json(new ApiResponse(false, 'Invalid product ID', null, 400));
    }

    // Confirm product exists
    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res
        .status(404)
        .json(new ApiResponse(false, 'Product not found', null, 404));
    }

    // Find or initialise the user's wishlist
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      // First item — create the document directly
      wishlist = await Wishlist.create({
        userId,
        items: [{ productId, addedAt: new Date() }],
      });
      return res
        .status(201)
        .json(new ApiResponse(true, 'Product added to wishlist', wishlist));
    }

    // Check for duplicate (Req 3.3)
    const alreadyPresent = wishlist.items.some(
      (item) => item.productId.toString() === productId
    );
    if (alreadyPresent) {
      return res
        .status(409)
        .json(new ApiResponse(false, 'Product is already in your wishlist', null, 409));
    }

    // Enforce cap (Req 3.4)
    if (wishlist.items.length >= WISHLIST_CAP) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            false,
            `Wishlist limit of ${WISHLIST_CAP} items reached`,
            null,
            400
          )
        );
    }

    wishlist.items.push({
      productId: new mongoose.Types.ObjectId(productId),
      addedAt: new Date(),
    });
    await wishlist.save();

    return res
      .status(201)
      .json(new ApiResponse(true, 'Product added to wishlist', wishlist));
  } catch (error: any) {
    return res
      .status(500)
      .json(
        new ApiResponse(false, error.message || 'Failed to add to wishlist', null, 500)
      );
  }
};

/**
 * DELETE /api/wishlist/:productId
 * Removes a product from the wishlist.
 * - 404 if the product is not in the wishlist
 * - 200 on success
 *
 * Requirements 3.6, 3.7
 */
export const removeFromWishlist = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json(new ApiResponse(false, 'Invalid product ID', null, 400));
    }

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res
        .status(404)
        .json(new ApiResponse(false, 'Product not found in wishlist', null, 404));
    }

    const originalLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(
      (item) => item.productId.toString() !== productId
    );

    // Nothing was removed — product was not in the wishlist (Req 3.7)
    if (wishlist.items.length === originalLength) {
      return res
        .status(404)
        .json(new ApiResponse(false, 'Product not found in wishlist', null, 404));
    }

    await wishlist.save();

    return res
      .status(200)
      .json(new ApiResponse(true, 'Product removed from wishlist', wishlist));
  } catch (error: any) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          false,
          error.message || 'Failed to remove from wishlist',
          null,
          500
        )
      );
  }
};
