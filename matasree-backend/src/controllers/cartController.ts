import { Response } from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { ApiResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Get user's cart
 */
export const getCart = async (req: AuthenticatedRequest, res: Response) => {
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
export const addToCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json(new ApiResponse(false, 'Invalid product or quantity', null, 400));
    }

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
export const updateCartItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity < 1) {
      return res.status(400).json(new ApiResponse(false, 'Invalid product or quantity', null, 400));
    }

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
export const removeFromCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.body;

    const cart = await Cart.findOne({ userId: req.user?.userId });
    if (!cart) {
      return res.status(404).json(new ApiResponse(false, 'Cart not found', null, 404));
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.productId');
    res.status(200).json(new ApiResponse(true, 'Item removed from cart', populatedCart));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to remove from cart', null, 500));
  }
};

/**
 * Clear entire cart
 */
export const clearCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.user?.userId }, { items: [] }, { new: true });
    res.status(200).json(new ApiResponse(true, 'Cart cleared'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to clear cart', null, 500));
  }
};
