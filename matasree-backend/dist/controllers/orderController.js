"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRefund = exports.downloadInvoice = exports.updateOrderStatus = exports.getAllOrders = exports.cancelOrder = exports.getOrderById = exports.getOrders = exports.verifyPayment = exports.createOrder = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Order_1 = __importDefault(require("../models/Order"));
const Payment_1 = __importDefault(require("../models/Payment"));
const Cart_1 = __importDefault(require("../models/Cart"));
const Address_1 = __importDefault(require("../models/Address"));
const Product_1 = __importDefault(require("../models/Product"));
const User_1 = __importDefault(require("../models/User"));
const response_1 = require("../utils/response");
const razorpay_1 = require("../utils/razorpay");
const invoiceGenerator_1 = require("../utils/invoiceGenerator");
const email_1 = require("../utils/email");
const logger_1 = __importDefault(require("../config/logger"));
const joi_1 = __importDefault(require("joi"));
const loyaltyService_1 = require("../services/loyaltyService");
const razorpay_2 = require("../utils/razorpay");
const createOrderSchema = joi_1.default.object({
    addressId: joi_1.default.string().required(),
    paymentMethod: joi_1.default.string().valid('razorpay', 'cod').required(),
    couponCode: joi_1.default.string().trim().uppercase().optional(),
    discountAmount: joi_1.default.number().min(0).optional().default(0),
});
const verifyPaymentSchema = joi_1.default.object({
    orderId: joi_1.default.string().required(),
    razorpayPaymentId: joi_1.default.string().required(),
    razorpayOrderId: joi_1.default.string().required(),
    razorpaySignature: joi_1.default.string().required(),
});
const updateOrderStatusSchema = joi_1.default.object({
    orderstatus: joi_1.default.string().valid('pending', 'confirmed', 'shipped', 'delivered', 'cancelled').required(),
});
/**
 * Create an order
 */
const createOrder = async (req, res) => {
    try {
        const { error, value } = createOrderSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { addressId, paymentMethod, couponCode, discountAmount: rawDiscount } = value;
        // Ensure discountAmount is a non-negative number (clamp to 0)
        const discountAmount = Math.max(0, Number(rawDiscount) || 0);
        // Get user's cart
        const cart = await Cart_1.default.findOne({ userId: req.user?.userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Cart is empty', null, 400));
        }
        // Get address
        const address = await Address_1.default.findById(addressId);
        if (!address) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Address not found', null, 404));
        }
        // Pre-check stock for all items (Phase 1, Req 3.1)
        for (const item of cart.items) {
            const prod = item.productId;
            const product = await Product_1.default.findById(prod._id);
            if (!product) {
                return res.status(400).json(new response_1.ApiResponse(false, `Product "${prod?.name || 'Unknown'}" not found`, null, 400));
            }
            const variant = product.variants.find((v) => v.weight === item.weight);
            const liveStock = variant ? variant.stock : product.stock;
            if (liveStock < item.quantity) {
                return res.status(400).json(new response_1.ApiResponse(false, `Product "${prod.name}" (${item.weight || 'base'}) has insufficient stock. Available: ${liveStock}, Required: ${item.quantity}`, null, 400));
            }
        }
        // Calculate total and prepare order items
        let itemsTotal = 0;
        const orderItems = cart.items.map((item) => {
            const itemTotal = item.price * item.quantity;
            itemsTotal += itemTotal;
            const prod = item.productId;
            return {
                productId: prod._id,
                name: prod.name,
                price: item.price,
                quantity: item.quantity,
                image: prod.image,
                weight: item.weight,
            };
        });
        // Req 32.2, 32.3 — apply discount; totalAmount is clamped to ≥ 0
        const totalAmount = Math.max(0, itemsTotal - discountAmount);
        // Generate unique collision-resistant order number (Phase 1, Req 1.1)
        const orderNumber = `ORD-${Date.now()}-${crypto_1.default.randomUUID().slice(0, 8).toUpperCase()}`;
        // Create order with duplicate key error handler (Phase 1, Req 1.2, 1.3)
        let order;
        try {
            order = await Order_1.default.create({
                userId: req.user?.userId,
                orderNumber,
                items: orderItems,
                totalAmount,
                ...(couponCode ? { couponCode } : {}),
                ...(discountAmount > 0 ? { discountAmount } : {}),
                shippingAddress: {
                    name: address.name,
                    addressLine1: address.addressLine1,
                    addressLine2: address.addressLine2,
                    city: address.city,
                    state: address.state,
                    pincode: address.pincode,
                    phone: address.phone,
                },
                paymentMethod,
                paymentStatus: 'pending',
                orderstatus: 'pending',
            });
        }
        catch (createError) {
            if (createError.code === 11000) {
                return res.status(409).json(new response_1.ApiResponse(false, 'Order number collision', null, 409));
            }
            throw createError;
        }
        // Create payment record & handle stock reservation/decrements
        let razorpayOrder = null;
        if (paymentMethod === 'razorpay') {
            try {
                razorpayOrder = await (0, razorpay_1.createRazorpayOrder)(totalAmount, order._id.toString());
            }
            catch (razorpayError) {
                // Clean up the order we just created since payment setup failed
                await Order_1.default.findByIdAndDelete(order._id);
                const msg = razorpayError.message || 'Payment gateway error';
                return res.status(503).json(new response_1.ApiResponse(false, msg, null, 503));
            }
            await Payment_1.default.create({
                orderId: order._id,
                userId: req.user?.userId,
                amount: totalAmount,
                status: 'pending',
                method: 'razorpay',
                razorpayOrderId: razorpayOrder.id,
            });
            // Atomic stock decrement for Razorpay orders (Phase 1, Req 3.2)
            const decrementedItems = [];
            let rollbackNeeded = false;
            let failedItemName = '';
            for (const item of orderItems) {
                const hasVariant = await Product_1.default.findOne({ _id: item.productId, "variants.weight": item.weight });
                let updatedProduct;
                if (hasVariant) {
                    updatedProduct = await Product_1.default.findOneAndUpdate({ _id: item.productId, "variants.weight": item.weight, "variants.stock": { $gte: item.quantity } }, { $inc: { "variants.$.stock": -item.quantity, sold: item.quantity } }, { new: true });
                }
                else {
                    updatedProduct = await Product_1.default.findOneAndUpdate({ _id: item.productId, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity, sold: item.quantity } }, { new: true });
                }
                if (!updatedProduct) {
                    rollbackNeeded = true;
                    failedItemName = item.name;
                    break;
                }
                decrementedItems.push({ productId: item.productId, quantity: item.quantity, weight: item.weight });
            }
            if (rollbackNeeded) {
                // Rollback already decremented stock (Phase 1, Req 3.7)
                for (const decItem of decrementedItems) {
                    if (decItem.weight) {
                        const hasVariant = await Product_1.default.findOne({ _id: decItem.productId, "variants.weight": decItem.weight });
                        if (hasVariant) {
                            await Product_1.default.findOneAndUpdate({ _id: decItem.productId, "variants.weight": decItem.weight }, { $inc: { "variants.$.stock": decItem.quantity, sold: -decItem.quantity } });
                            continue;
                        }
                    }
                    await Product_1.default.findByIdAndUpdate(decItem.productId, {
                        $inc: { stock: decItem.quantity, sold: -decItem.quantity }
                    });
                }
                // Delete order and payment
                await Order_1.default.findByIdAndDelete(order._id);
                await Payment_1.default.deleteOne({ orderId: order._id });
                return res.status(400).json(new response_1.ApiResponse(false, `Product "${failedItemName}" is out of stock`, null, 400));
            }
            // After successful Razorpay order creation, set stockReservedAt (Phase 1, Req 3.3)
            await Order_1.default.findByIdAndUpdate(order._id, { stockReservedAt: new Date() });
        }
        else {
            await Payment_1.default.create({
                orderId: order._id,
                userId: req.user?.userId,
                amount: totalAmount,
                status: 'pending',
                method: 'cod',
            });
            // Atomic conditional stock decrement for COD orders — mirrors Razorpay branch (Bug 4 fix)
            const decrementedItemsCOD = [];
            let rollbackNeededCOD = false;
            let failedItemNameCOD = '';
            for (const item of orderItems) {
                const hasVariant = await Product_1.default.findOne({ _id: item.productId, "variants.weight": item.weight });
                let updatedProduct;
                if (hasVariant) {
                    updatedProduct = await Product_1.default.findOneAndUpdate({ _id: item.productId, "variants.weight": item.weight, "variants.stock": { $gte: item.quantity } }, { $inc: { "variants.$.stock": -item.quantity, sold: item.quantity } }, { new: true });
                }
                else {
                    updatedProduct = await Product_1.default.findOneAndUpdate({ _id: item.productId, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity, sold: item.quantity } }, { new: true });
                }
                if (!updatedProduct) {
                    rollbackNeededCOD = true;
                    failedItemNameCOD = item.name;
                    break;
                }
                decrementedItemsCOD.push({ productId: item.productId, quantity: item.quantity, weight: item.weight });
            }
            if (rollbackNeededCOD) {
                // Rollback already decremented items
                for (const decItem of decrementedItemsCOD) {
                    if (decItem.weight) {
                        const hasVariant = await Product_1.default.findOne({ _id: decItem.productId, "variants.weight": decItem.weight });
                        if (hasVariant) {
                            await Product_1.default.findOneAndUpdate({ _id: decItem.productId, "variants.weight": decItem.weight }, { $inc: { "variants.$.stock": decItem.quantity, sold: -decItem.quantity } });
                            continue;
                        }
                    }
                    await Product_1.default.findByIdAndUpdate(decItem.productId, {
                        $inc: { stock: decItem.quantity, sold: -decItem.quantity }
                    });
                }
                // Delete order and payment
                await Order_1.default.findByIdAndDelete(order._id);
                await Payment_1.default.deleteOne({ orderId: order._id });
                return res.status(400).json(new response_1.ApiResponse(false, `Product "${failedItemNameCOD}" is out of stock`, null, 400));
            }
        }
        // Clear cart
        await Cart_1.default.findOneAndUpdate({ userId: req.user?.userId }, { items: [] });
        // Send order confirmation email for COD orders
        if (paymentMethod === 'cod') {
            try {
                const userDoc = await User_1.default.findById(req.user?.userId).select('email');
                if (userDoc?.email) {
                    await (0, email_1.sendOrderConfirmationEmail)({
                        orderNumber,
                        items: orderItems.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
                        totalAmount,
                        shippingAddress: {
                            fullName: address.name,
                            addressLine1: address.addressLine1,
                            ...(address.addressLine2 ? { addressLine2: address.addressLine2 } : {}),
                            city: address.city,
                            state: address.state,
                            pincode: address.pincode,
                            phone: address.phone,
                        },
                        paymentMethod: 'cod',
                    }, userDoc.email);
                }
            }
            catch (emailError) {
                logger_1.default.warn('Failed to send order confirmation email for COD order:', emailError);
            }
        }
        return res.status(201).json(new response_1.ApiResponse(true, 'Order created', {
            order,
            razorpayOrder: paymentMethod === 'razorpay' ? razorpayOrder : null,
        }));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to create order', null, 500));
    }
};
exports.createOrder = createOrder;
/**
 * Verify Razorpay payment
 */
const verifyPayment = async (req, res) => {
    try {
        const { error, value } = verifyPaymentSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = value;
        // Verify signature
        const isSignatureValid = (0, razorpay_1.verifyRazorpaySignature)(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!isSignatureValid) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid payment signature', null, 400));
        }
        // Update order and payment
        const order = await Order_1.default.findByIdAndUpdate(orderId, { paymentStatus: 'paid', orderstatus: 'confirmed', stockReservedAt: null }, { new: true });
        await Payment_1.default.findOneAndUpdate({ orderId }, {
            status: 'success',
            razorpayPaymentId,
            razorpaySignature,
        }, { new: true });
        // Send order confirmation email for online payment
        try {
            if (order) {
                const userDoc = await User_1.default.findById(order.userId).select('email');
                if (userDoc?.email) {
                    await (0, email_1.sendOrderConfirmationEmail)({
                        orderNumber: order.orderNumber,
                        items: order.items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
                        totalAmount: order.totalAmount,
                        shippingAddress: {
                            fullName: order.shippingAddress?.name || '',
                            addressLine1: order.shippingAddress?.addressLine1 || '',
                            ...(order.shippingAddress?.addressLine2 ? { addressLine2: order.shippingAddress.addressLine2 } : {}),
                            city: order.shippingAddress?.city || '',
                            state: order.shippingAddress?.state || '',
                            pincode: order.shippingAddress?.pincode || '',
                            phone: order.shippingAddress?.phone || '',
                        },
                        paymentMethod: 'razorpay',
                    }, userDoc.email);
                }
            }
        }
        catch (emailError) {
            logger_1.default.warn('Failed to send order confirmation email for Razorpay order:', emailError);
        }
        // Award loyalty points for the confirmed payment (Req 10.1)
        // Only award if points have not already been awarded for this order
        if (order && !order.loyaltyPointsEarned) {
            try {
                const subtotalPaid = (order.totalAmount || 0) -
                    (order.discountAmount || 0) -
                    (order.loyaltyDiscountAmount || 0);
                await (0, loyaltyService_1.awardLoyaltyPoints)(order._id, order.userId, subtotalPaid);
            }
            catch (loyaltyError) {
                logger_1.default.warn(`[orderController] Failed to award loyalty points for order ${order._id}:`, loyaltyError);
            }
        }
        return res.status(200).json(new response_1.ApiResponse(true, 'Payment verified successfully', order));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Payment verification failed', null, 500));
    }
};
exports.verifyPayment = verifyPayment;
/**
 * Get user's orders
 */
const getOrders = async (req, res) => {
    try {
        const orders = await Order_1.default.find({ userId: req.user?.userId })
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json(new response_1.ApiResponse(true, 'Orders fetched', orders));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch orders', null, 500));
    }
};
exports.getOrders = getOrders;
/**
 * Get order by ID
 */
const getOrderById = async (req, res) => {
    try {
        const order = await Order_1.default.findOne({
            _id: req.params.id,
            userId: req.user?.userId,
        });
        if (!order) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Order not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Order fetched', order));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch order', null, 500));
    }
};
exports.getOrderById = getOrderById;
/**
 * Cancel an order (Customer)
 * Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6
 */
const cancelOrder = async (req, res) => {
    try {
        // Find order belonging to the authenticated user (enforces ownership — 404 if not found or not owner)
        const order = await Order_1.default.findOne({
            _id: req.params.id,
            userId: req.user?.userId,
        });
        if (!order) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Order not found', null, 404));
        }
        // Only pending or confirmed orders can be cancelled (Req 31.1)
        if (!['pending', 'confirmed'].includes(order.orderstatus)) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Order cannot be cancelled at this stage', null, 400));
        }
        // Set order status to cancelled (Req 31.2)
        order.orderstatus = 'cancelled';
        order.stockReservedAt = null;
        await order.save();
        // Send cancellation email (Phase 2, Req 8.6)
        try {
            const userDoc = await User_1.default.findById(order.userId).select('email');
            if (userDoc?.email) {
                const refundAmount = order.paymentStatus === 'paid' ? order.totalAmount : 0;
                await (0, email_1.sendCancelledEmail)(order.orderNumber, userDoc.email, refundAmount);
            }
        }
        catch (emailError) {
            logger_1.default.warn(`Failed to send order cancellation email for order ${order._id}:`, emailError.message);
        }
        // Restore stock for each item (Req 31.3)
        for (const item of order.items) {
            if (item.weight) {
                const hasVariant = await Product_1.default.findOne({ _id: item.productId, "variants.weight": item.weight });
                if (hasVariant) {
                    await Product_1.default.findOneAndUpdate({ _id: item.productId, "variants.weight": item.weight }, { $inc: { "variants.$.stock": item.quantity } });
                    continue;
                }
            }
            await Product_1.default.findByIdAndUpdate(item.productId, {
                $inc: { stock: item.quantity },
            });
        }
        // Reverse loyalty points if any were earned for this order (Req 31.4)
        if (order.loyaltyPointsEarned && order.loyaltyPointsEarned > 0) {
            try {
                await (0, loyaltyService_1.reverseLoyaltyPoints)(order._id, order.userId);
            }
            catch (loyaltyError) {
                logger_1.default.warn(`[orderController] cancelOrder: Failed to reverse loyalty points for order ${order._id}:`, loyaltyError);
            }
        }
        // Initiate Razorpay refund if payment was made via Razorpay and is paid (Req 31.5, 31.6)
        if (order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid') {
            try {
                const payment = await Payment_1.default.findOne({ orderId: order._id });
                if (payment?.razorpayPaymentId) {
                    await razorpay_2.razorpayInstance.payments.refund(payment.razorpayPaymentId, {
                        amount: Math.round(order.totalAmount * 100), // paise
                    });
                    await Payment_1.default.findByIdAndUpdate(payment._id, { status: 'refund_initiated' });
                }
            }
            catch (refundError) {
                logger_1.default.warn(`[orderController] cancelOrder: Failed to initiate Razorpay refund for order ${order._id}:`, refundError);
            }
        }
        return res.status(200).json(new response_1.ApiResponse(true, 'Order cancelled successfully', order));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to cancel order', null, 500));
    }
};
exports.cancelOrder = cancelOrder;
/**
 * Get all orders (Admin)
 */
const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        let query = {};
        if (status) {
            query.orderstatus = status;
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const orders = await Order_1.default.find(query)
            .populate('userId', 'name email phone')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        const total = await Order_1.default.countDocuments(query);
        res.status(200).json(new response_1.ApiResponse(true, 'Orders fetched', {
            orders,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch orders', null, 500));
    }
};
exports.getAllOrders = getAllOrders;
/**
 * Update order status (Admin)
 */
const updateOrderStatus = async (req, res) => {
    try {
        const { error, value } = updateOrderStatusSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { orderstatus } = value;
        // Fetch the existing order first so we can check paymentMethod and current state
        const existingOrder = await Order_1.default.findById(req.params.id);
        if (!existingOrder) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Order not found', null, 404));
        }
        const order = await Order_1.default.findByIdAndUpdate(req.params.id, { orderstatus }, { new: true });
        if (!order) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Order not found', null, 404));
        }
        // Dispatch order status transactional emails (Phase 2, Req 8.4)
        try {
            const userDoc = await User_1.default.findById(order.userId).select('email');
            if (userDoc?.email) {
                if (orderstatus === 'shipped') {
                    const estDate = new Date();
                    estDate.setDate(estDate.getDate() + 4);
                    const estString = estDate.toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    });
                    await (0, email_1.sendShippedEmail)(order.orderNumber, userDoc.email, estString, order.shippingAddress);
                }
                else if (orderstatus === 'out_for_delivery' || orderstatus === 'out for delivery') {
                    await (0, email_1.sendOutForDeliveryEmail)(order.orderNumber, userDoc.email, order.shippingAddress);
                }
                else if (orderstatus === 'delivered') {
                    await (0, email_1.sendDeliveredEmail)(order.orderNumber, userDoc.email);
                }
                else if (orderstatus === 'cancelled') {
                    const refundAmount = order.paymentStatus === 'paid' ? order.totalAmount : 0;
                    await (0, email_1.sendCancelledEmail)(order.orderNumber, userDoc.email, refundAmount);
                }
            }
        }
        catch (emailError) {
            logger_1.default.warn(`[orderController] Failed to send status email for order ${order._id}:`, emailError.message);
        }
        // Award loyalty points when a COD order is delivered (Req 10.1)
        // Only award if the status is transitioning to 'delivered', the order is COD,
        // and points have not already been awarded for this order
        if (orderstatus === 'delivered' &&
            existingOrder.paymentMethod === 'cod' &&
            !existingOrder.loyaltyPointsEarned) {
            try {
                const subtotalPaid = (order.totalAmount || 0) -
                    (order.discountAmount || 0) -
                    (order.loyaltyDiscountAmount || 0);
                await (0, loyaltyService_1.awardLoyaltyPoints)(order._id, order.userId, subtotalPaid);
            }
            catch (loyaltyError) {
                logger_1.default.warn(`[orderController] Failed to award loyalty points for COD order ${order._id}:`, loyaltyError);
            }
        }
        return res.status(200).json(new response_1.ApiResponse(true, 'Order status updated', order));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to update order', null, 500));
    }
};
exports.updateOrderStatus = updateOrderStatus;
/**
 * Download GST Tax Invoice HTML / PDF
 */
const downloadInvoice = async (req, res) => {
    try {
        const order = await Order_1.default.findById(req.params.id);
        if (!order) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Order not found', null, 404));
        }
        if (req.user && req.user.role !== 'admin' && order.userId.toString() !== req.user.userId) {
            return res.status(403).json(new response_1.ApiResponse(false, 'Unauthorized to view this invoice', null, 403));
        }
        const invoiceData = {
            orderNumber: order.orderNumber,
            invoiceNumber: `INV-${order.orderNumber}`,
            invoiceDate: order.createdAt || new Date(),
            items: order.items.map((item) => ({
                name: item.name,
                variant: item.weight,
                quantity: item.quantity,
                price: item.price,
            })),
            subtotal: (order.totalAmount || 0) + (order.discountAmount || 0) - (order.shippingCharge || 0),
            shippingCharge: order.shippingCharge || 0,
            discountAmount: order.discountAmount || 0,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            shippingAddress: {
                fullName: order.shippingAddress?.name || order.shippingAddress?.fullName || 'Valued Customer',
                addressLine1: order.shippingAddress?.addressLine1 || '',
                addressLine2: order.shippingAddress?.addressLine2 || '',
                city: order.shippingAddress?.city || '',
                state: order.shippingAddress?.state || '',
                pincode: order.shippingAddress?.pincode || '',
                phone: order.shippingAddress?.phone || '',
            },
        };
        const html = (0, invoiceGenerator_1.generateInvoiceHtml)(invoiceData);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="Invoice-${order.orderNumber}.html"`);
        return res.status(200).send(html);
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to generate invoice', null, 500));
    }
};
exports.downloadInvoice = downloadInvoice;
/**
 * Process Razorpay Refund (Admin)
 */
const processRefund = async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        const targetOrderId = orderId || req.params.id;
        const order = await Order_1.default.findById(targetOrderId);
        if (!order) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Order not found', null, 404));
        }
        const payment = await Payment_1.default.findOne({ orderId: order._id });
        if (!payment || !payment.razorpayPaymentId) {
            return res.status(400).json(new response_1.ApiResponse(false, 'No valid Razorpay payment ID found for refund', null, 400));
        }
        const refundAmount = amount || order.totalAmount;
        const razorpayRefund = await (0, razorpay_1.createRazorpayRefund)(payment.razorpayPaymentId, refundAmount, {
            orderNumber: order.orderNumber,
            reason: 'Admin initiated refund',
        });
        order.paymentStatus = 'refunded';
        order.orderstatus = 'refunded';
        await order.save();
        await Payment_1.default.findByIdAndUpdate(payment._id, {
            status: 'refunded',
        });
        const userDoc = await User_1.default.findById(order.userId).select('email');
        if (userDoc?.email) {
            (0, email_1.sendRefundCompletedEmail)(order.orderNumber, userDoc.email, refundAmount, razorpayRefund.id).catch((e) => logger_1.default.warn('Failed to send refund completion email:', e));
        }
        return res.status(200).json(new response_1.ApiResponse(true, 'Refund processed successfully', { refund: razorpayRefund, order }));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to process refund', null, 500));
    }
};
exports.processRefund = processRefund;
//# sourceMappingURL=orderController.js.map