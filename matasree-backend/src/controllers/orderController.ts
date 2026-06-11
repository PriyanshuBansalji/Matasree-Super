import { Response } from 'express';
import Order from '../models/Order';
import Payment from '../models/Payment';
import Cart from '../models/Cart';
import Address from '../models/Address';
import Product from '../models/Product';
import User from '../models/User';
import { ApiResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { createRazorpayOrder, verifyRazorpaySignature } from '../utils/razorpay';
import { sendOrderConfirmationEmail } from '../utils/email';
import logger from '../config/logger';
import Joi from 'joi';
import { awardLoyaltyPoints, reverseLoyaltyPoints } from '../services/loyaltyService';
import { rewardReferrer } from '../services/referralService';
import { razorpayInstance } from '../utils/razorpay';

const createOrderSchema = Joi.object({
  addressId: Joi.string().required(),
  paymentMethod: Joi.string().valid('razorpay', 'cod').required(),
  couponCode: Joi.string().trim().uppercase().optional(),
  discountAmount: Joi.number().min(0).optional().default(0),
});

const verifyPaymentSchema = Joi.object({
  orderId: Joi.string().required(),
  razorpayPaymentId: Joi.string().required(),
  razorpayOrderId: Joi.string().required(),
  razorpaySignature: Joi.string().required(),
});

const updateOrderStatusSchema = Joi.object({
  orderstatus: Joi.string().valid('pending', 'confirmed', 'shipped', 'delivered', 'cancelled').required(),
});

/**
 * Create an order
 */
export const createOrder = async (req: any, res: Response) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { addressId, paymentMethod, couponCode, discountAmount: rawDiscount } = value;

    // Ensure discountAmount is a non-negative number (clamp to 0)
    const discountAmount = Math.max(0, Number(rawDiscount) || 0);

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
    let itemsTotal = 0;
    const orderItems = cart.items.map((item: any) => {
      const itemTotal = item.price * item.quantity;
      itemsTotal += itemTotal;
      return {
        productId: item.productId._id,
        name: item.productId.name,
        price: item.price,
        quantity: item.quantity,
        image: item.productId.image,
      };
    });

    // Req 32.2, 32.3 — apply discount; totalAmount is clamped to ≥ 0
    const totalAmount = Math.max(0, itemsTotal - discountAmount);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Create order
    const order = await Order.create({
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

    // Send order confirmation email for COD orders
    if (paymentMethod === 'cod') {
      try {
        const userDoc = await User.findById(req.user?.userId).select('email');
        if (userDoc?.email) {
          await sendOrderConfirmationEmail(
            {
              orderNumber,
              items: orderItems.map((item: any) => ({ name: item.name, quantity: item.quantity, price: item.price })),
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
            },
            userDoc.email
          );
        }
      } catch (emailError) {
        logger.warn('Failed to send order confirmation email for COD order:', emailError);
      }
    }

    return res.status(201).json(
      new ApiResponse(true, 'Order created', {
        order,
        razorpayOrder: paymentMethod === 'razorpay' ? razorpayOrder : null,
      })
    );
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to create order', null, 500));
  }
};

/**
 * Verify Razorpay payment
 */
export const verifyPayment = async (req: any, res: Response) => {
  try {
    const { error, value } = verifyPaymentSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = value;

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

    // Send order confirmation email for online payment
    try {
      if (order) {
        const userDoc = await User.findById(order.userId).select('email');
        if (userDoc?.email) {
          await sendOrderConfirmationEmail(
            {
              orderNumber: (order as any).orderNumber,
              items: (order as any).items.map((item: any) => ({ name: item.name, quantity: item.quantity, price: item.price })),
              totalAmount: (order as any).totalAmount,
              shippingAddress: {
                fullName: (order as any).shippingAddress?.name || '',
                addressLine1: (order as any).shippingAddress?.addressLine1 || '',
                ...((order as any).shippingAddress?.addressLine2 ? { addressLine2: (order as any).shippingAddress.addressLine2 } : {}),
                city: (order as any).shippingAddress?.city || '',
                state: (order as any).shippingAddress?.state || '',
                pincode: (order as any).shippingAddress?.pincode || '',
                phone: (order as any).shippingAddress?.phone || '',
              },
              paymentMethod: 'razorpay',
            },
            userDoc.email
          );
        }
      }
    } catch (emailError) {
      logger.warn('Failed to send order confirmation email for Razorpay order:', emailError);
    }

    // Award loyalty points for the confirmed payment (Req 10.1)
    // Only award if points have not already been awarded for this order
    if (order && !order.loyaltyPointsEarned) {
      try {
        const subtotalPaid =
          (order.totalAmount || 0) -
          (order.discountAmount || 0) -
          (order.loyaltyDiscountAmount || 0);
        await awardLoyaltyPoints(order._id, order.userId, subtotalPaid);
      } catch (loyaltyError) {
        logger.warn(`[orderController] Failed to award loyalty points for order ${order._id}:`, loyaltyError);
      }
    }

    return res.status(200).json(new ApiResponse(true, 'Payment verified successfully', order));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Payment verification failed', null, 500));
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
 * Cancel an order (Customer)
 * Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6
 */
export const cancelOrder = async (req: any, res: Response) => {
  try {
    // Find order belonging to the authenticated user (enforces ownership — 404 if not found or not owner)
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user?.userId,
    });

    if (!order) {
      return res.status(404).json(new ApiResponse(false, 'Order not found', null, 404));
    }

    // Only pending or confirmed orders can be cancelled (Req 31.1)
    if (!['pending', 'confirmed'].includes(order.orderstatus)) {
      return res.status(400).json(
        new ApiResponse(false, 'Order cannot be cancelled at this stage', null, 400)
      );
    }

    // Set order status to cancelled (Req 31.2)
    order.orderstatus = 'cancelled';
    await order.save();

    // Restore stock for each item (Req 31.3)
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }

    // Reverse loyalty points if any were earned for this order (Req 31.4)
    if (order.loyaltyPointsEarned && order.loyaltyPointsEarned > 0) {
      try {
        await reverseLoyaltyPoints(order._id, order.userId);
      } catch (loyaltyError) {
        logger.warn(
          `[orderController] cancelOrder: Failed to reverse loyalty points for order ${order._id}:`,
          loyaltyError
        );
      }
    }

    // Initiate Razorpay refund if payment was made via Razorpay and is paid (Req 31.5, 31.6)
    if (order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid') {
      try {
        const payment = await Payment.findOne({ orderId: order._id });
        if (payment?.razorpayPaymentId) {
          await razorpayInstance.payments.refund(payment.razorpayPaymentId, {
            amount: Math.round(order.totalAmount * 100), // paise
          });
          await Payment.findByIdAndUpdate(payment._id, { status: 'refund_initiated' });
        }
      } catch (refundError) {
        logger.warn(
          `[orderController] cancelOrder: Failed to initiate Razorpay refund for order ${order._id}:`,
          refundError
        );
      }
    }

    return res.status(200).json(new ApiResponse(true, 'Order cancelled successfully', order));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to cancel order', null, 500));
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
    const { error, value } = updateOrderStatusSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { orderstatus } = value;

    // Fetch the existing order first so we can check paymentMethod and current state
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(404).json(new ApiResponse(false, 'Order not found', null, 404));
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderstatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json(new ApiResponse(false, 'Order not found', null, 404));
    }

    // Award loyalty points when a COD order is delivered (Req 10.1)
    // Only award if the status is transitioning to 'delivered', the order is COD,
    // and points have not already been awarded for this order
    if (
      orderstatus === 'delivered' &&
      existingOrder.paymentMethod === 'cod' &&
      !existingOrder.loyaltyPointsEarned
    ) {
      try {
        const subtotalPaid =
          (order.totalAmount || 0) -
          (order.discountAmount || 0) -
          (order.loyaltyDiscountAmount || 0);
        await awardLoyaltyPoints(order._id, order.userId, subtotalPaid);
      } catch (loyaltyError) {
        logger.warn(`[orderController] Failed to award loyalty points for COD order ${order._id}:`, loyaltyError);
      }
    }

    return res.status(200).json(new ApiResponse(true, 'Order status updated', order));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to update order', null, 500));
  }
};
