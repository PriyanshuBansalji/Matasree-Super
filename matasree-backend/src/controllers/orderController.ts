import { Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Payment from '../models/Payment';
import Cart from '../models/Cart';
import Address from '../models/Address';
import Product from '../models/Product';
import User from '../models/User';
import { ApiResponse } from '../utils/response';
import { createCashfreeOrder, createCashfreeRefund, fetchCashfreeOrder, fetchCashfreeOrderPayments } from '../utils/cashfree';
import { generateInvoiceHtml, InvoiceOrderData } from '../utils/invoiceGenerator';
import {
  sendOrderConfirmationEmail,
  sendShippedEmail,
  sendOutForDeliveryEmail,
  sendDeliveredEmail,
  sendCancelledEmail,
  sendRefundCompletedEmail,
} from '../utils/email';
import logger from '../config/logger';
import Joi from 'joi';
import { awardLoyaltyPoints, reverseLoyaltyPoints } from '../services/loyaltyService';

const createOrderSchema = Joi.object({
  addressId: Joi.string().required(),
  paymentMethod: Joi.string().valid('cashfree', 'cod').required(),
  couponCode: Joi.string().trim().uppercase().optional(),
  discountAmount: Joi.number().min(0).optional().default(0),
  items: Joi.array().items(Joi.object()).optional(),
});

const verifyPaymentSchema = Joi.object({
  orderId: Joi.string().required(),
  cashfreeOrderId: Joi.string().optional(),
  cfPaymentId: Joi.string().optional(),
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

    const { addressId, paymentMethod, couponCode, discountAmount: rawDiscount, items: reqItems } = value;

    const discountAmount = Math.max(0, Number(rawDiscount) || 0);

    // Get user's cart
    let cart = await Cart.findOne({ userId: req.user?.userId }).populate('items.productId');

    // Auto-sync cart from request body items if DB cart is empty
    if ((!cart || cart.items.length === 0) && Array.isArray(reqItems) && reqItems.length > 0) {
      const syncedItems = [];
      for (const reqItem of reqItems) {
        const rawId = reqItem.productId || reqItem._id || reqItem.id;
        const cleanId = typeof rawId === 'string' && rawId.includes('-') ? rawId.split('-')[0] : rawId;
        if (cleanId && mongoose.Types.ObjectId.isValid(cleanId)) {
          syncedItems.push({
            productId: new mongoose.Types.ObjectId(cleanId),
            quantity: reqItem.quantity || 1,
            price: reqItem.price || 100,
            weight: reqItem.weight || '100g',
          });
        }
      }
      if (syncedItems.length > 0) {
        cart = await Cart.findOneAndUpdate(
          { userId: req.user?.userId },
          { items: syncedItems },
          { upsert: true, new: true }
        ).populate('items.productId');
      }
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json(new ApiResponse(false, 'Cart is empty. Add items to cart before placing an order.', null, 400));
    }

    cart.items = cart.items.filter((item: any) => item.productId != null);
    if (cart.items.length === 0) {
      return res.status(400).json(new ApiResponse(false, 'Cart items are invalid or unavailable', null, 400));
    }

    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json(new ApiResponse(false, 'Address not found', null, 404));
    }

    // Pre-check stock for all items
    for (const item of cart.items) {
      const prod = item.productId as any;
      const product = await Product.findById(prod._id);
      if (!product) {
        return res.status(400).json(new ApiResponse(false, `Product "${prod?.name || 'Unknown'}" not found`, null, 400));
      }

      const variant = product.variants.find((v: any) => v.weight === item.weight);
      const liveStock = variant ? variant.stock : product.stock;

      if (liveStock < item.quantity) {
        return res.status(400).json(
          new ApiResponse(
            false,
            `Product "${prod.name}" (${item.weight || 'base'}) has insufficient stock. Available: ${liveStock}, Required: ${item.quantity}`,
            null,
            400
          )
        );
      }
    }

    let itemsTotal = 0;
    const orderItems = cart.items.map((item: any) => {
      const itemTotal = item.price * item.quantity;
      itemsTotal += itemTotal;
      const prod = item.productId as any;
      return {
        productId: prod._id,
        name: prod.name,
        price: item.price,
        quantity: item.quantity,
        image: prod.image,
        weight: item.weight,
      };
    });

    const totalAmount = Math.max(0, itemsTotal - discountAmount);
    const orderNumber = `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    let order;
    try {
      order = await Order.create({
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
    } catch (createError: any) {
      if (createError.code === 11000) {
        return res.status(409).json(new ApiResponse(false, 'Order number collision', null, 409));
      }
      throw createError;
    }

    let cashfreeOrder: any = null;
    if (paymentMethod === 'cashfree') {
      try {
        const userDoc = await User.findById(req.user?.userId).select('name email phone');
        cashfreeOrder = await createCashfreeOrder(totalAmount, order._id.toString(), {
          customerId: req.user?.userId || order._id.toString(),
          customerName: address.name || userDoc?.name || 'Customer',
          customerEmail: userDoc?.email || 'customer@matasreesuper.com',
          customerPhone: address.phone || userDoc?.phone || '9999999999',
        });

        order.cashfreeOrderId = cashfreeOrder.order_id;
        order.paymentSessionId = cashfreeOrder.payment_session_id;
        await order.save();
      } catch (cashfreeError: any) {
        await Order.findByIdAndDelete(order._id);
        const msg = cashfreeError.message || 'Cashfree payment gateway error';
        return res.status(503).json(new ApiResponse(false, msg, null, 503));
      }

      await Payment.create({
        orderId: order._id,
        userId: req.user?.userId,
        amount: totalAmount,
        status: 'pending',
        method: 'cashfree',
        cashfreeOrderId: cashfreeOrder.order_id,
        rawGatewayResponse: cashfreeOrder,
      });

      // Atomic stock decrement for Cashfree orders
      const decrementedItems: Array<{ productId: any; quantity: number; weight?: string }> = [];
      let rollbackNeeded = false;
      let failedItemName = '';

      for (const item of orderItems) {
        const hasVariant = await Product.findOne({ _id: item.productId, "variants.weight": item.weight });
        let updatedProduct;
        if (hasVariant) {
          updatedProduct = await Product.findOneAndUpdate(
            { _id: item.productId, "variants.weight": item.weight, "variants.stock": { $gte: item.quantity } },
            { $inc: { "variants.$.stock": -item.quantity, sold: item.quantity } },
            { new: true }
          );
        } else {
          updatedProduct = await Product.findOneAndUpdate(
            { _id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity, sold: item.quantity } },
            { new: true }
          );
        }

        if (!updatedProduct) {
          rollbackNeeded = true;
          failedItemName = item.name;
          break;
        }
        decrementedItems.push({ productId: item.productId, quantity: item.quantity, weight: item.weight });
      }

      if (rollbackNeeded) {
        for (const decItem of decrementedItems) {
          if (decItem.weight) {
            const hasVariant = await Product.findOne({ _id: decItem.productId, "variants.weight": decItem.weight });
            if (hasVariant) {
              await Product.findOneAndUpdate(
                { _id: decItem.productId, "variants.weight": decItem.weight },
                { $inc: { "variants.$.stock": decItem.quantity, sold: -decItem.quantity } }
              );
              continue;
            }
          }
          await Product.findByIdAndUpdate(decItem.productId, {
            $inc: { stock: decItem.quantity, sold: -decItem.quantity }
          });
        }
        await Order.findByIdAndDelete(order._id);
        await Payment.deleteOne({ orderId: order._id });

        return res.status(400).json(
          new ApiResponse(false, `Product "${failedItemName}" is out of stock`, null, 400)
        );
      }

      await Order.findByIdAndUpdate(order._id, { stockReservedAt: new Date() });
    } else {
      await Payment.create({
        orderId: order._id,
        userId: req.user?.userId,
        amount: totalAmount,
        status: 'pending',
        method: 'cod',
      });

      const decrementedItemsCOD: Array<{ productId: any; quantity: number; weight?: string }> = [];
      let rollbackNeededCOD = false;
      let failedItemNameCOD = '';

      for (const item of orderItems) {
        const hasVariant = await Product.findOne({ _id: item.productId, "variants.weight": item.weight });
        let updatedProduct;
        if (hasVariant) {
          updatedProduct = await Product.findOneAndUpdate(
            { _id: item.productId, "variants.weight": item.weight, "variants.stock": { $gte: item.quantity } },
            { $inc: { "variants.$.stock": -item.quantity, sold: item.quantity } },
            { new: true }
          );
        } else {
          updatedProduct = await Product.findOneAndUpdate(
            { _id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity, sold: item.quantity } },
            { new: true }
          );
        }

        if (!updatedProduct) {
          rollbackNeededCOD = true;
          failedItemNameCOD = item.name;
          break;
        }
        decrementedItemsCOD.push({ productId: item.productId, quantity: item.quantity, weight: item.weight });
      }

      if (rollbackNeededCOD) {
        for (const decItem of decrementedItemsCOD) {
          if (decItem.weight) {
            const hasVariant = await Product.findOne({ _id: decItem.productId, "variants.weight": decItem.weight });
            if (hasVariant) {
              await Product.findOneAndUpdate(
                { _id: decItem.productId, "variants.weight": decItem.weight },
                { $inc: { "variants.$.stock": decItem.quantity, sold: -decItem.quantity } }
              );
              continue;
            }
          }
          await Product.findByIdAndUpdate(decItem.productId, {
            $inc: { stock: decItem.quantity, sold: -decItem.quantity }
          });
        }
        await Order.findByIdAndDelete(order._id);
        await Payment.deleteOne({ orderId: order._id });

        return res.status(400).json(
          new ApiResponse(false, `Product "${failedItemNameCOD}" is out of stock`, null, 400)
        );
      }
    }

    await Cart.findOneAndUpdate({ userId: req.user?.userId }, { items: [] });

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
        paymentSessionId: cashfreeOrder?.payment_session_id || null,
        cashfreeOrderId: cashfreeOrder?.order_id || null,
      })
    );
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to create order', null, 500));
  }
};

/**
 * Verify Cashfree payment status
 */
export const verifyPayment = async (req: any, res: Response) => {
  try {
    const { error, value } = verifyPaymentSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { orderId, cashfreeOrderId, cfPaymentId } = value;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json(new ApiResponse(false, 'Order not found', null, 404));
    }

    const targetCfOrderId = cashfreeOrderId || order.cashfreeOrderId || order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const cfOrder = await fetchCashfreeOrder(targetCfOrderId);

    if (cfOrder?.order_status !== 'PAID') {
      // Check payments if status is pending
      const payments = await fetchCashfreeOrderPayments(targetCfOrderId);
      const successfulPayment = Array.isArray(payments) ? payments.find((p: any) => p.payment_status === 'SUCCESS') : null;

      if (!successfulPayment) {
        return res.status(400).json(new ApiResponse(false, 'Cashfree payment not completed yet', null, 400));
      }
    }

    // Update order and payment
    order.paymentStatus = 'paid';
    order.orderstatus = 'confirmed';
    order.stockReservedAt = null;
    if (cfPaymentId) {
      order.cashfreePaymentId = cfPaymentId;
    }
    await order.save();

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        status: 'success',
        cashfreePaymentId: cfPaymentId || order.cashfreePaymentId,
        cashfreeOrderId: targetCfOrderId,
        rawGatewayResponse: cfOrder,
      },
      { upsert: true, new: true }
    );

    // Send order confirmation email
    try {
      const userDoc = await User.findById(order.userId).select('email');
      if (userDoc?.email) {
        await sendOrderConfirmationEmail(
          {
            orderNumber: order.orderNumber,
            items: order.items.map((item: any) => ({ name: item.name, quantity: item.quantity, price: item.price })),
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
            paymentMethod: 'cashfree',
          },
          userDoc.email
        );
      }
    } catch (emailError) {
      logger.warn('Failed to send order confirmation email for Cashfree order:', emailError);
    }

    if (!order.loyaltyPointsEarned) {
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
    const order = await Order.findById(req.params.id);

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
 */
export const cancelOrder = async (req: any, res: Response) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user?.userId,
    });

    if (!order) {
      return res.status(404).json(new ApiResponse(false, 'Order not found', null, 404));
    }

    if (!['pending', 'confirmed'].includes(order.orderstatus)) {
      return res.status(400).json(
        new ApiResponse(false, 'Order cannot be cancelled at this stage', null, 400)
      );
    }

    order.orderstatus = 'cancelled';
    order.stockReservedAt = null;
    await order.save();

    try {
      const userDoc = await User.findById(order.userId).select('email');
      if (userDoc?.email) {
        const refundAmount = order.paymentStatus === 'paid' ? order.totalAmount : 0;
        await sendCancelledEmail(order.orderNumber, userDoc.email, refundAmount);
      }
    } catch (emailError: any) {
      logger.warn(`Failed to send order cancellation email for order ${order._id}:`, emailError.message);
    }

    for (const item of order.items) {
      if (item.weight) {
        const hasVariant = await Product.findOne({ _id: item.productId, "variants.weight": item.weight });
        if (hasVariant) {
          await Product.findOneAndUpdate(
            { _id: item.productId, "variants.weight": item.weight },
            { $inc: { "variants.$.stock": item.quantity } }
          );
          continue;
        }
      }
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }

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

    // Initiate Cashfree refund if payment was made online and is paid
    if ((order.paymentMethod === 'cashfree' || order.paymentMethod === 'razorpay') && order.paymentStatus === 'paid') {
      try {
        const refundId = `ref_cancel_${order._id.toString()}_${Date.now()}`;
        const cfOrderId = order.cashfreeOrderId || order._id.toString().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
        await createCashfreeRefund(cfOrderId, refundId, order.totalAmount, 'Customer cancelled order');
        
        order.refundIds = order.refundIds || [];
        order.refundIds.push(refundId);
        await order.save();

        await Payment.findOneAndUpdate({ orderId: order._id }, { status: 'refund_initiated' });
      } catch (refundError) {
        logger.warn(
          `[orderController] cancelOrder: Failed to initiate Cashfree refund for order ${order._id}:`,
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

    try {
      const userDoc = await User.findById(order.userId).select('email');
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
          await sendShippedEmail(order.orderNumber, userDoc.email, estString, order.shippingAddress);
        } else if (orderstatus === 'out_for_delivery' || orderstatus === 'out for delivery') {
          await sendOutForDeliveryEmail(order.orderNumber, userDoc.email, order.shippingAddress);
        } else if (orderstatus === 'delivered') {
          await sendDeliveredEmail(order.orderNumber, userDoc.email);
        } else if (orderstatus === 'cancelled') {
          const refundAmount = order.paymentStatus === 'paid' ? order.totalAmount : 0;
          await sendCancelledEmail(order.orderNumber, userDoc.email, refundAmount);
        }
      }
    } catch (emailError: any) {
      logger.warn(`[orderController] Failed to send status email for order ${order._id}:`, emailError.message);
    }

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

/**
 * Download GST Tax Invoice HTML
 */
export const downloadInvoice = async (req: any, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json(new ApiResponse(false, 'Order not found', null, 404));
    }

    if (req.user && req.user.role !== 'admin' && order.userId.toString() !== req.user.userId) {
      return res.status(403).json(new ApiResponse(false, 'Unauthorized to view this invoice', null, 403));
    }

    const invoiceData: InvoiceOrderData = {
      orderNumber: order.orderNumber,
      invoiceNumber: `INV-${order.orderNumber}`,
      invoiceDate: order.createdAt || new Date(),
      items: order.items.map((item: any) => ({
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

    const html = generateInvoiceHtml(invoiceData);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="Invoice-${order.orderNumber}.html"`);
    return res.status(200).send(html);
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to generate invoice', null, 500));
  }
};

/**
 * Process Cashfree Refund (Admin)
 */
export const processRefund = async (req: any, res: Response) => {
  try {
    const { orderId, amount, reason } = req.body;
    const targetOrderId = orderId || req.params.id;
    const order = await Order.findById(targetOrderId);
    if (!order) {
      return res.status(404).json(new ApiResponse(false, 'Order not found', null, 404));
    }

    const cfOrderId = order.cashfreeOrderId || order._id.toString().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const refundId = `ref_admin_${order._id.toString()}_${Date.now()}`;
    const refundAmount = amount || order.totalAmount;

    const cfRefund = await createCashfreeRefund(cfOrderId, refundId, refundAmount, reason || 'Admin initiated refund');

    order.paymentStatus = 'refunded';
    order.orderstatus = 'refunded';
    order.refundIds = order.refundIds || [];
    order.refundIds.push(refundId);
    await order.save();

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        status: 'refunded',
      }
    );

    const userDoc = await User.findById(order.userId).select('email');
    if (userDoc?.email) {
      sendRefundCompletedEmail(order.orderNumber, userDoc.email, refundAmount, refundId).catch((e) =>
        logger.warn('Failed to send refund completion email:', e)
      );
    }

    return res.status(200).json(new ApiResponse(true, 'Cashfree refund processed successfully', { refund: cfRefund, refundId, order }));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to process Cashfree refund', null, 500));
  }
};
