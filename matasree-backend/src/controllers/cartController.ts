import { Response } from 'express';
import mongoose from 'mongoose';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { ApiResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import Joi from 'joi';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const addToCartSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
});

const updateCartItemSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
});

const removeFromCartSchema = Joi.object({
  productId: Joi.string().required(),
});

/**
 * Get user's cart
 */
export const getCart = async (req: any, res: Response) => {
  try {
    let cart = await Cart.findOne({ userId: req.user?.userId }).populate('items.productId');

    if (!cart) {
      cart = await Cart.create({ userId: req.user?.userId, items: [] });
    }

    res.status(200).json(new ApiResponse(true, 'Cart fetched', cart));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch cart', null, 500));
  }
};

/**
 * Add item to cart
 */
export const addToCart = async (req: any, res: Response) => {
  try {
    const { error, value } = addToCartSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { productId, quantity } = value;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json(new ApiResponse(false, 'Product not found', null, 404));
    }

    if (product.stock < quantity) {
      return res.status(400).json(new ApiResponse(false, 'Insufficient stock', null, 400));
    }

    let cart = await Cart.findOne({ userId: req.user?.userId });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user?.userId,
        items: [{ productId, quantity, price: product.price }],
      });
    } else {
      const existingItem = cart.items.find((item) => item.productId.toString() === productId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ productId, quantity, price: product.price, addedAt: new Date() } as any);
      }

      await cart.save();
    }

    const populatedCart = await Cart.findById(cart._id).populate('items.productId');
    res.status(200).json(new ApiResponse(true, 'Item added to cart', populatedCart));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to add to cart', null, 500));
  }
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (req: any, res: Response) => {
  try {
    const { error, value } = updateCartItemSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { productId, quantity } = value;

    const cart = await Cart.findOne({ userId: req.user?.userId });
    if (!cart) {
      return res.status(404).json(new ApiResponse(false, 'Cart not found', null, 404));
    }

    const item = cart.items.find((item) => item.productId.toString() === productId);
    if (!item) {
      return res.status(404).json(new ApiResponse(false, 'Item not in cart', null, 404));
    }

    item.quantity = quantity;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.productId');
    res.status(200).json(new ApiResponse(true, 'Cart updated', populatedCart));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to update cart', null, 500));
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (req: any, res: Response) => {
  try {
    const { error, value } = removeFromCartSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { productId } = value;

    const cart = await Cart.findOne({ userId: req.user?.userId });
    if (!cart) {
      return res.status(404).json(new ApiResponse(false, 'Cart not found', null, 404));
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.productId');
    return res.status(200).json(new ApiResponse(true, 'Item removed from cart', populatedCart));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to remove from cart', null, 500));
  }
};

/**
 * Clear entire cart
 */
export const clearCart = async (req: any, res: Response) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.user?.userId }, { items: [] }, { new: true });
    res.status(200).json(new ApiResponse(true, 'Cart cleared'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to clear cart', null, 500));
  }
};

/**
 * Sync cart — POST /api/cart/sync
 *
 * Validates client cart items against live product prices and stock.
 * - Items whose product no longer exists or is out of stock are moved to removedItems.
 * - Items whose live price differs from the client price are recorded in priceDiffs.
 * - Quantities are capped at available stock.
 * - The reconciled cart is persisted to the database.
 *
 * Request body: { items: [{ productId: string, quantity: number, clientPrice: number }] }
 * Response:     { success: true, data: { syncedItems, priceDiffs, removedItems } }
 *
 * Requirements: 24.1, 24.2, 24.3, 24.4
 */
export const syncCart = async (req: any, res: Response) => {
  try {
    const { items: clientItems } = req.body as {
      items: Array<{ productId: string; quantity: number; clientPrice: number }>;
    };

    // Validate request body
    if (!Array.isArray(clientItems)) {
      return res
        .status(400)
        .json(new ApiResponse(false, 'items must be an array', null, 400));
    }

    // Validate each item's shape
    for (const item of clientItems) {
      if (
        !item.productId ||
        !mongoose.Types.ObjectId.isValid(item.productId) ||
        typeof item.quantity !== 'number' ||
        item.quantity < 1 ||
        typeof item.clientPrice !== 'number' ||
        item.clientPrice < 0
      ) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              false,
              'Each item must have a valid productId, a positive quantity, and a non-negative clientPrice',
              null,
              400,
            ),
          );
      }
    }

    // Fetch all referenced products in a single query
    const productIds = clientItems.map((item) => item.productId);
    const liveProducts = await Product.find({ _id: { $in: productIds } });

    // Build a Map for O(1) lookup
    const liveMap = new Map<string, (typeof liveProducts)[number]>();
    for (const product of liveProducts) {
      liveMap.set(product._id.toString(), product);
    }

    // Reconcile each client item against live data
    const syncedItems: Array<{
      productId: mongoose.Types.ObjectId;
      quantity: number;
      price: number;
    }> = [];

    const priceDiffs: Array<{
      productId: string;
      oldPrice: number;
      newPrice: number;
    }> = [];

    const removedItems: Array<{
      productId: string;
      quantity: number;
      clientPrice: number;
    }> = [];

    for (const clientItem of clientItems) {
      const live = liveMap.get(clientItem.productId);

      // Remove items whose product is gone or out of stock (Req 24.2)
      if (!live || live.stock === 0) {
        removedItems.push({
          productId: clientItem.productId,
          quantity: clientItem.quantity,
          clientPrice: clientItem.clientPrice,
        });
        continue;
      }

      // Record price changes (Req 24.3)
      if (live.price !== clientItem.clientPrice) {
        priceDiffs.push({
          productId: clientItem.productId,
          oldPrice: clientItem.clientPrice,
          newPrice: live.price,
        });
      }

      // Cap quantity at available stock (Req 24.1)
      syncedItems.push({
        productId: live._id,
        quantity: Math.min(clientItem.quantity, live.stock),
        price: live.price,
      });
    }

    // Persist reconciled cart (Req 24.4)
    await Cart.findOneAndUpdate(
      { userId: req.user?.userId },
      { items: syncedItems },
      { upsert: true, new: true },
    );

    return res.status(200).json(
      new ApiResponse(true, 'Cart synced successfully', {
        syncedItems,
        priceDiffs,
        removedItems,
      }),
    );
  } catch (error: any) {
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to sync cart', null, 500));
  }
};
