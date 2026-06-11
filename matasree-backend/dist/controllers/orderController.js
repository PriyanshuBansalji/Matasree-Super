"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getAllOrders = exports.getOrderById = exports.getOrders = exports.verifyPayment = exports.createOrder = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const Payment_1 = __importDefault(require("../models/Payment"));
const Cart_1 = __importDefault(require("../models/Cart"));
const Address_1 = __importDefault(require("../models/Address"));
const Product_1 = __importDefault(require("../models/Product"));
const User_1 = __importDefault(require("../models/User"));
const response_1 = require("../utils/response");
const razorpay_1 = require("../utils/razorpay");
const email_1 = require("../utils/email");
const logger_1 = __importDefault(require("../config/logger"));
const joi_1 = __importDefault(require("joi"));
const createOrderSchema = joi_1.default.object({
    addressId: joi_1.default.string().required(),
    paymentMethod: joi_1.default.string().valid('razorpay', 'cod').required(),
});
/**
 * Create an order
 */
const createOrder = async (req, res) => {
    try {
        const { error, value } = createOrderSchema.validate(req.body);
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { addressId, paymentMethod } = value;
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
        // Calculate total and prepare order items
        let totalAmount = 0;
        const orderItems = cart.items.map((item) => {
            const itemTotal = item.price * item.quantity;
            totalAmount += itemTotal;
            return {
                productId: item.productId._id,
                name: item.productId.name,
                price: item.price,
                quantity: item.quantity,
                image: item.productId.image,
            };
        });
        // Generate order number
        const orderNumber = `ORD-${Date.now()}`;
        // Create order
        const order = await Order_1.default.create({
            userId: req.user?.userId,
            orderNumber,
            items: orderItems,
            totalAmount,
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
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
            orderstatus: 'pending',
        });
        // Create payment record
        let razorpayOrder = null;
        if (paymentMethod === 'razorpay') {
            razorpayOrder = await (0, razorpay_1.createRazorpayOrder)(totalAmount, order._id.toString());
            await Payment_1.default.create({
                orderId: order._id,
                userId: req.user?.userId,
                amount: totalAmount,
                status: 'pending',
                method: 'razorpay',
                razorpayOrderId: razorpayOrder.id,
            });
        }
        else {
            await Payment_1.default.create({
                orderId: order._id,
                userId: req.user?.userId,
                amount: totalAmount,
                status: 'pending',
                method: 'cod',
            });
        }
        // Update product sold count and stock
        for (const item of orderItems) {
            await Product_1.default.findByIdAndUpdate(item.productId, {
                $inc: { sold: item.quantity, stock: -item.quantity }
            });
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
        const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
        if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Missing payment details', null, 400));
        }
        // Verify signature
        const isSignatureValid = (0, razorpay_1.verifyRazorpaySignature)(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!isSignatureValid) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid payment signature', null, 400));
        }
        // Update order and payment
        const order = await Order_1.default.findByIdAndUpdate(orderId, { paymentStatus: 'paid', orderstatus: 'confirmed' }, { new: true });
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
        const { orderstatus } = req.body;
        if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(orderstatus)) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid order status', null, 400));
        }
        const order = await Order_1.default.findByIdAndUpdate(req.params.id, { orderstatus }, { new: true });
        if (!order) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Order not found', null, 404));
        }
        return res.status(200).json(new response_1.ApiResponse(true, 'Order status updated', order));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to update order', null, 500));
    }
};
exports.updateOrderStatus = updateOrderStatus;
//# sourceMappingURL=orderController.js.map