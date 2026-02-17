"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const Cart_1 = __importDefault(require("../models/Cart"));
const Product_1 = __importDefault(require("../models/Product"));
const response_1 = require("../utils/response");
/**
 * Get user's cart
 */
const getCart = async (req, res) => {
    try {
        let cart = await Cart_1.default.findOne({ userId: req.user?.userId }).populate('items.productId');
        if (!cart) {
            cart = await Cart_1.default.create({ userId: req.user?.userId, items: [] });
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Cart fetched', cart));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch cart', null, 500));
    }
};
exports.getCart = getCart;
/**
 * Add item to cart
 */
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        if (!productId || !quantity || quantity < 1) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid product or quantity', null, 400));
        }
        const product = await Product_1.default.findById(productId);
        if (!product) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Product not found', null, 404));
        }
        if (product.stock < quantity) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Insufficient stock', null, 400));
        }
        let cart = await Cart_1.default.findOne({ userId: req.user?.userId });
        if (!cart) {
            cart = await Cart_1.default.create({
                userId: req.user?.userId,
                items: [{ productId, quantity, price: product.price }],
            });
        }
        else {
            const existingItem = cart.items.find((item) => item.productId.toString() === productId);
            if (existingItem) {
                existingItem.quantity += quantity;
            }
            else {
                cart.items.push({ productId, quantity, price: product.price, addedAt: new Date() });
            }
            await cart.save();
        }
        const populatedCart = await Cart_1.default.findById(cart._id).populate('items.productId');
        res.status(200).json(new response_1.ApiResponse(true, 'Item added to cart', populatedCart));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to add to cart', null, 500));
    }
};
exports.addToCart = addToCart;
/**
 * Update cart item quantity
 */
const updateCartItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        if (!productId || quantity < 1) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid product or quantity', null, 400));
        }
        const cart = await Cart_1.default.findOne({ userId: req.user?.userId });
        if (!cart) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Cart not found', null, 404));
        }
        const item = cart.items.find((item) => item.productId.toString() === productId);
        if (!item) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Item not in cart', null, 404));
        }
        item.quantity = quantity;
        await cart.save();
        const populatedCart = await Cart_1.default.findById(cart._id).populate('items.productId');
        res.status(200).json(new response_1.ApiResponse(true, 'Cart updated', populatedCart));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to update cart', null, 500));
    }
};
exports.updateCartItem = updateCartItem;
/**
 * Remove item from cart
 */
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const cart = await Cart_1.default.findOne({ userId: req.user?.userId });
        if (!cart) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Cart not found', null, 404));
        }
        cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
        await cart.save();
        const populatedCart = await Cart_1.default.findById(cart._id).populate('items.productId');
        res.status(200).json(new response_1.ApiResponse(true, 'Item removed from cart', populatedCart));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to remove from cart', null, 500));
    }
};
exports.removeFromCart = removeFromCart;
/**
 * Clear entire cart
 */
const clearCart = async (req, res) => {
    try {
        await Cart_1.default.findOneAndUpdate({ userId: req.user?.userId }, { items: [] }, { new: true });
        res.status(200).json(new response_1.ApiResponse(true, 'Cart cleared'));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to clear cart', null, 500));
    }
};
exports.clearCart = clearCart;
//# sourceMappingURL=cartController.js.map