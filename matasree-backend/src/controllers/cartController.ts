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
  weight: Joi.string().required(),
});

const updateCartItemSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  weight: Joi.string().required(),
});

const removeFromCartSchema = Joi.object({
  productId: Joi.string().required(),
  weight: Joi.string().required(),
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

    const { productId, quantity, weight } = value;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json(new ApiResponse(false, 'Product not found', null, 404));
    }

    // Find live weight variant details
    const variant = product.variants.find((v) => v.weight === weight);
    const livePrice = variant ? variant.price : product.price;
    const liveStock = variant ? variant.stock : product.stock;

    if (liveStock < quantity) {
      return res.status(400).json(new ApiResponse(false, 'Insufficient stock', null, 400));
    }

    let cart = await Cart.findOne({ userId: req.user?.userId });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user?.userId,
        items: [{ productId, quantity, price: livePrice, weight }],
        abandonmentEmailSentAt: null, // fresh cart — reset abandonment tracker
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId && item.weight === weight
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ productId, quantity, price: livePrice, weight, addedAt: new Date() } as any);
      }

      // Reset abandonment tracker whenever items are modified (user is active again)
      cart.abandonmentEmailSentAt = undefined as any;

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

    const { productId, quantity, weight } = value;

    const cart = await Cart.findOne({ userId: req.user?.userId });
    if (!cart) {
      return res.status(404).json(new ApiResponse(false, 'Cart not found', null, 404));
    }

    const item = cart.items.find(
      (item) => item.productId.toString() === productId && item.weight === weight
    );
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

    const { productId, weight } = value;

    const cart = await Cart.findOne({ userId: req.user?.userId });
    if (!cart) {
      return res.status(404).json(new ApiResponse(false, 'Cart not found', null, 404));
    }

    cart.items = cart.items.filter(
      (item) => !(item.productId.toString() === productId && item.weight === weight)
    );
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
    await Cart.findOneAndUpdate(
      { userId: req.user?.userId },
      { items: [], $unset: { abandonmentEmailSentAt: '' } },
      { new: true }
    );
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
      items: Array<{ productId: string; quantity: number; clientPrice: number; weight: string }>;
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
        item.clientPrice < 0 ||
        typeof item.weight !== 'string'
      ) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              false,
              'Each item must have a valid productId, weight, positive quantity, and non-negative clientPrice',
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
      weight: string;
    }> = [];

    const priceDiffs: Array<{
      productId: string;
      weight: string;
      oldPrice: number;
      newPrice: number;
    }> = [];

    const removedItems: Array<{
      productId: string;
      weight: string;
      quantity: number;
      clientPrice: number;
    }> = [];

    for (const clientItem of clientItems) {
      const live = liveMap.get(clientItem.productId);

      if (!live) {
        removedItems.push({
          productId: clientItem.productId,
          weight: clientItem.weight,
          quantity: clientItem.quantity,
          clientPrice: clientItem.clientPrice,
        });
        continue;
      }

      // Reconcile against specific weight variant
      const variant = live.variants.find((v) => v.weight === clientItem.weight);
      const livePrice = variant ? variant.price : live.price;
      const liveStock = variant ? variant.stock : live.stock;

      // Remove items whose product/variant is out of stock (Req 24.2)
      if (liveStock === 0) {
        removedItems.push({
          productId: clientItem.productId,
          weight: clientItem.weight,
          quantity: clientItem.quantity,
          clientPrice: clientItem.clientPrice,
        });
        continue;
      }

      // Record price changes (Req 24.3)
      if (livePrice !== clientItem.clientPrice) {
        priceDiffs.push({
          productId: clientItem.productId,
          weight: clientItem.weight,
          oldPrice: clientItem.clientPrice,
          newPrice: livePrice,
        });
      }

      // Cap quantity at available stock (Req 24.1)
      syncedItems.push({
        productId: live._id,
        quantity: Math.min(clientItem.quantity, liveStock),
        price: livePrice,
        weight: clientItem.weight,
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
