import { Router, Request, Response } from 'express';
import Order from '../models/Order';
import Payment from '../models/Payment';
import User from '../models/User';
import WebhookEvent from '../models/WebhookEvent';
import { verifyCashfreeWebhookSignature } from '../utils/cashfree';
import {
  sendPaymentSuccessEmail,
  sendPaymentFailureEmail,
  sendRefundCompletedEmail,
  sendNewOrderAdminNotificationEmail,
  getAdminEmail,
} from '../utils/email';
import { awardLoyaltyPoints } from '../services/loyaltyService';
import logger from '../config/logger';

const router = Router();

/**
 * POST /api/webhooks/cashfree
 * Cashfree Webhook Handler with HMAC verification & Idempotency check
 */
router.post('/cashfree', async (req: Request, res: Response) => {
  try {
    const signature = (req.headers['x-webhook-signature'] as string) || (req.headers['x-cashfree-signature'] as string);
    const timestamp = (req.headers['x-webhook-timestamp'] as string) || (req.headers['x-cashfree-timestamp'] as string) || '';
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (!signature) {
      logger.warn('[Webhook] Missing X-Webhook-Signature header');
      return res.status(400).json({ success: false, message: 'Missing signature header' });
    }

    // Verify Cashfree Webhook Signature
    const isValid = verifyCashfreeWebhookSignature(signature, rawBody, timestamp);
    if (!isValid && process.env.NODE_ENV === 'production') {
      logger.error('[Webhook] Invalid Cashfree webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const payload = req.body;
    const eventType = payload.type || payload.event || 'PAYMENT_SUCCESS_WEBHOOK';
    const eventId = payload.event_id || `${eventType}_${payload.data?.order?.order_id}_${payload.data?.payment?.cf_payment_id || Date.now()}`;

    logger.info(`[Webhook] Received Cashfree event: ${eventType} (ID: ${eventId})`);

    // Idempotency check
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent) {
      logger.info(`[Webhook] Duplicate event ${eventId} ignored (already processed)`);
      return res.status(200).json({ success: true, message: 'Duplicate event already processed' });
    }

    await WebhookEvent.create({
      eventId,
      eventType,
      payload,
    });

    const data = payload.data || {};
    const orderData = data.order || {};
    const paymentData = data.payment || {};
    const refundData = data.refund || {};

    const cfOrderId = orderData.order_id;
    const cfPaymentId = paymentData.cf_payment_id || paymentData.payment_id;
    const paymentStatus = paymentData.payment_status;

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || paymentStatus === 'SUCCESS') {
      let order = null;
      if (cfOrderId) {
        order = await Order.findOne({ $or: [{ cashfreeOrderId: cfOrderId }, { orderNumber: cfOrderId }, { _id: mongooseValidId(cfOrderId) }] });
      }

      if (order) {
        order.paymentStatus = 'paid';
        order.orderstatus = 'confirmed';
        order.stockReservedAt = null;
        if (cfPaymentId) {
          order.cashfreePaymentId = String(cfPaymentId);
        }
        await order.save();

        await Payment.findOneAndUpdate(
          { orderId: order._id },
          {
            status: 'success',
            cashfreePaymentId: cfPaymentId ? String(cfPaymentId) : order.cashfreePaymentId,
            cashfreeOrderId: cfOrderId || order.cashfreeOrderId,
            rawGatewayResponse: payload,
          },
          { upsert: true, new: true }
        );

        const userDoc = await User.findById(order.userId).select('email');
        const userEmail = userDoc?.email;

        if (userEmail) {
          sendPaymentSuccessEmail(
            order.orderNumber,
            userEmail,
            order.totalAmount,
            cfPaymentId ? String(cfPaymentId) : 'Cashfree Online'
          ).catch((e) => logger.warn('[Webhook] Failed to send payment success email:', e));
        }

        sendNewOrderAdminNotificationEmail(getAdminEmail(), {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          customerName: order.shippingAddress?.fullName || order.shippingAddress?.name || 'Customer',
          customerEmail: userEmail || 'customer@matasreesuper.com',
        }).catch((e) => logger.warn('[Webhook] Failed to send admin new order alert:', e));

        if (!order.loyaltyPointsEarned) {
          const subtotalPaid =
            (order.totalAmount || 0) -
            (order.discountAmount || 0) -
            (order.loyaltyDiscountAmount || 0);
          awardLoyaltyPoints(order._id, order.userId, subtotalPaid).catch((e) =>
            logger.warn('[Webhook] Failed to award loyalty points:', e)
          );
        }
      }
    } else if (eventType === 'PAYMENT_FAILED_WEBHOOK' || paymentStatus === 'FAILED') {
      const failureReason = paymentData.payment_message || 'Payment failed';

      if (cfOrderId) {
        const order = await Order.findOne({ $or: [{ cashfreeOrderId: cfOrderId }, { orderNumber: cfOrderId }] });
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'failed';
          await order.save();

          const userDoc = await User.findById(order.userId).select('email');
          if (userDoc?.email) {
            sendPaymentFailureEmail(
              order.orderNumber,
              userDoc.email,
              order.totalAmount,
              failureReason
            ).catch((e) => logger.warn('[Webhook] Failed to send payment failure email:', e));
          }
        }
      }
    } else if (eventType === 'REFUND_STATUS_WEBHOOK' || refundData.refund_status === 'SUCCESS') {
      const refundId = refundData.refund_id;
      const refundAmount = refundData.refund_amount ? Number(refundData.refund_amount) : 0;

      if (cfOrderId) {
        const order = await Order.findOne({ $or: [{ cashfreeOrderId: cfOrderId }, { orderNumber: cfOrderId }] });
        if (order) {
          order.paymentStatus = 'refunded';
          order.orderstatus = 'refunded';
          await order.save();

          const userDoc = await User.findById(order.userId).select('email');
          if (userDoc?.email) {
            sendRefundCompletedEmail(
              order.orderNumber,
              userDoc.email,
              refundAmount || order.totalAmount,
              refundId
            ).catch((e) => logger.warn('[Webhook] Failed to send refund completed email:', e));
          }
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Cashfree webhook processed successfully' });
  } catch (error: any) {
    logger.error('[Webhook] Error processing Cashfree webhook:', error);
    return res.status(500).json({ success: false, message: error.message || 'Webhook processing failed' });
  }
});

function mongooseValidId(id: string) {
  return id && id.length === 24 ? id : undefined;
}

export default router;
