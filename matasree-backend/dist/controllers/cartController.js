"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCart = exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
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
        if (!productId) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Product ID is required', null, 400));
        }
        const cart = await Cart_1.default.findOne({ userId: req.user?.userId });
        if (!cart) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Cart not found', null, 404));
        }
        cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
        await cart.save();
        const populatedCart = await Cart_1.default.findById(cart._id).populate('items.productId');
        return res.status(200).json(new response_1.ApiResponse(true, 'Item removed from cart', populatedCart));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to remove from cart', null, 500));
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
const syncCart = async (req, res) => {
    try {
        const { items: clientItems } = req.body;
        // Validate request body
        if (!Array.isArray(clientItems)) {
            return res
                .status(400)
                .json(new response_1.ApiResponse(false, 'items must be an array', null, 400));
        }
        // Validate each item's shape
        for (const item of clientItems) {
            if (!item.productId ||
                !mongoose_1.default.Types.ObjectId.isValid(item.productId) ||
                typeof item.quantity !== 'number' ||
                item.quantity < 1 ||
                typeof item.clientPrice !== 'number' ||
                item.clientPrice < 0) {
                return res
                    .status(400)
                    .json(new response_1.ApiResponse(false, 'Each item must have a valid productId, a positive quantity, and a non-negative clientPrice', null, 400));
            }
        }
        // Fetch all referenced products in a single query
        const productIds = clientItems.map((item) => item.productId);
        const liveProducts = await Product_1.default.find({ _id: { $in: productIds } });
        // Build a Map for O(1) lookup
        const liveMap = new Map();
        for (const product of liveProducts) {
            liveMap.set(product._id.toString(), product);
        }
        // Reconcile each client item against live data
        const syncedItems = [];
        const priceDiffs = [];
        const removedItems = [];
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
        await Cart_1.default.findOneAndUpdate({ userId: req.user?.userId }, { items: syncedItems }, { upsert: true, new: true });
        return res.status(200).json(new response_1.ApiResponse(true, 'Cart synced successfully', {
            syncedItems,
            priceDiffs,
            removedItems,
        }));
    }
    catch (error) {
        return res
            .status(500)
            .json(new response_1.ApiResponse(false, error.message || 'Failed to sync cart', null, 500));
    }
};
exports.syncCart = syncCart;
//# sourceMappingURL=cartController.js.map