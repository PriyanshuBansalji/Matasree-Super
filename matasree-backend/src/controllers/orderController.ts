import { Response } from 'express';
import Order from '../models/Order';
import Payment from '../models/Payment';
import Cart from '../models/Cart';
import Address from '../models/Address';
import Product from '../models/Product';
import { ApiResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { createRazorpayOrder, verifyRazorpaySignature } from '../utils/razorpay';
import Joi from 'joi';

const createOrderSchema = Joi.object({
  addressId: Joi.string().required(),
  paymentMethod: Joi.string().valid('razorpay', 'cod').required(),
});

/**
 * Create an order
 */
export const createOrder = async (req: any, res: Response) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { addressId, paymentMethod } = value;

    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user?.userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json(new ApiResponse(false, 'Cart is empty', null, 400));
    }

    // Get address
    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json(new ApiResponse(false, 'Address not found', null, 404));
    }

    // Calculate total and prepare order items
    let totalAmount = 0;
    const orderItems = cart.items.map((item: any) => {
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
    const order = await Order.create({
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
    let razorpayOrder: any = null;
    if (paymentMethod === 'razorpay') {
      razorpayOrder = await createRazorpayOrder(totalAmount, order._id.toString());

      await Payment.create({
        orderId: order._id,
        userId: req.user?.userId,
        amount: totalAmount,
        status: 'pending',
        method: 'razorpay',
        razorpayOrderId: razorpayOrder.id,
      });
    } else {
      await Payment.create({
        orderId: order._id,
        userId: req.user?.userId,
        amount: totalAmount,
        status: 'pending',
        method: 'cod',
      });
    }

    // Update product sold count and stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { sold: item.quantity, stock: -item.quantity }
      });
    }

    // Clear cart
    await Cart.findOneAndUpdate({ userId: req.user?.userId }, { items: [] });

    res.status(201).json(
      new ApiResponse(true, 'Order created', {
        order,
        razorpayOrder: paymentMethod === 'razorpay' ? razorpayOrder : null,
      })
    );
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to create order', null, 500));
  }
};

/**
 * Verify Razorpay payment
 */
export const verifyPayment = async (req: any, res: Response) => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json(new ApiResponse(false, 'Missing payment details', null, 400));
    }

    // Verify signature
    const isSignatureValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isSignatureValid) {
      return res.status(400).json(new ApiResponse(false, 'Invalid payment signature', null, 400));
    }

    // Update order and payment
    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: 'paid', orderstatus: 'confirmed' },
      { new: true }
    );

    await Payment.findOneAndUpdate(
      { orderId },
      {
        status: 'success',
        razorpayPaymentId,
        razorpaySignature,
      },
      { new: true }
    );

    res.status(200).json(new ApiResponse(true, 'Payment verified successfully', order));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Payment verification failed', null, 500));
  }
};

/**
 * Get user's orders
 */
export const getOrders = async (req: any, res: Response) => {
  try {
    const orders = await Order.find({ userId: req.user?.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(new ApiResponse(true, 'Orders fetched', orders));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch orders', null, 500));
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req: any, res: Response) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user?.userId,
    });

    if (!order) {
      return res.status(404).json(new ApiResponse(false, 'Order not found', null, 404));
    }

    res.status(200).json(new ApiResponse(true, 'Order fetched', order));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch order', null, 500));
  }
};

/**
 * Get all orders (Admin)
 */
export const getAllOrders = async (req: any, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let query: any = {};

    if (status) {
      query.orderstatus = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .skip(skip)
      .limit(parseInt(limit as string))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.status(200).json(
      new ApiResponse(true, 'Orders fetched', {
        orders,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      })
    );
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch orders', null, 500));
  }
};

/**
 * Update order status (Admin)
 */
export const updateOrderStatus = async (req: any, res: Response) => {
  try {
    const { orderstatus } = req.body;

    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(orderstatus)) {
      return res.status(400).json(new ApiResponse(false, 'Invalid order status', null, 400));
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderstatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json(new ApiResponse(false, 'Order not found', null, 404));
    }

    res.status(200).json(new ApiResponse(true, 'Order status updated', order));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to update order', null, 500));
  }
};
