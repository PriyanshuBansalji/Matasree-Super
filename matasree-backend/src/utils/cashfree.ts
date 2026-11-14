import { Cashfree, CFEnvironment } from 'cashfree-pg';
import crypto from 'crypto';
import logger from '../config/logger';

export const getCashfreeEnvironment = (): CFEnvironment => {
  const env = (process.env.CASHFREE_ENVIRONMENT || 'SANDBOX').toUpperCase();
  return env === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
};

export const getCashfreeInstance = (): Cashfree => {
  const appId = process.env.CASHFREE_APP_ID || '';
  const secretKey = process.env.CASHFREE_SECRET_KEY || '';
  const env = getCashfreeEnvironment();

  if (!appId || !secretKey || appId === 'your_cashfree_app_id' || secretKey === 'your_cashfree_secret_key') {
    logger.warn('[Cashfree] Cashfree credentials are not properly set');
  }

  return new Cashfree(env, appId, secretKey);
};

export interface CustomerDetails {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

/**
 * Create Cashfree Order and obtain payment_session_id
 */
export const createCashfreeOrder = async (
  amount: number,
  orderId: string,
  customer: CustomerDetails,
  returnUrl?: string
) => {
  const cashfree = getCashfreeInstance();
  const formattedOrderId = orderId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);

  const request = {
    order_amount: Math.max(0.01, Number(amount.toFixed(2))),
    order_currency: 'INR',
    order_id: formattedOrderId,
    customer_details: {
      customer_id: customer.customerId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50),
      customer_name: customer.customerName || 'Valued Customer',
      customer_email: customer.customerEmail || 'customer@matasreesuper.com',
      customer_phone: customer.customerPhone || '9999999999',
    },
    order_meta: {
      return_url: returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-success/${orderId}?cf_id={order_id}`,
    },
  };

  try {
    const response = await cashfree.PGCreateOrder(request as any);
    return response.data;
  } catch (error: any) {
    logger.error('[Cashfree] Error creating Cashfree order:', error?.response?.data || error.message);
    throw new Error(error?.response?.data?.message || error.message || 'Failed to create Cashfree payment order');
  }
};

/**
 * Verify Cashfree Webhook Signature
 */
export const verifyCashfreeWebhookSignature = (
  signature: string,
  rawBody: string,
  timestamp: string
): boolean => {
  const secret = process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY;
  if (!secret || !signature || !timestamp) return false;

  try {
    const cashfree = getCashfreeInstance();
    const event = cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
    return !!event;
  } catch (err) {
    try {
      const data = timestamp + rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('base64');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }
};

/**
 * Fetch Order details from Cashfree API
 */
export const fetchCashfreeOrder = async (orderId: string): Promise<any> => {
  const cashfree = getCashfreeInstance();
  try {
    const response = await cashfree.PGFetchOrder(orderId);
    return response.data;
  } catch (error: any) {
    logger.error('[Cashfree] Error fetching Cashfree order:', error?.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetch Payments list for a Cashfree order
 */
export const fetchCashfreeOrderPayments = async (orderId: string): Promise<any> => {
  const cashfree = getCashfreeInstance();
  try {
    const response = await cashfree.PGOrderFetchPayments(orderId);
    return response.data;
  } catch (error: any) {
    logger.error('[Cashfree] Error fetching order payments:', error?.response?.data || error.message);
    return [];
  }
};

/**
 * Issue Refund via Cashfree Refund API
 */
export const createCashfreeRefund = async (
  orderId: string,
  refundId: string,
  amount: number,
  refundNote?: string
): Promise<any> => {
  const cashfree = getCashfreeInstance();
  const request = {
    refund_amount: Math.max(0.01, Number(amount.toFixed(2))),
    refund_id: refundId,
    refund_note: refundNote || 'Refund processed by Matasree Super Admin',
  };

  try {
    const response = await cashfree.PGOrderCreateRefund(orderId, request as any);
    return response.data;
  } catch (error: any) {
    logger.error('[Cashfree] Error creating refund:', error?.response?.data || error.message);
    throw new Error(error?.response?.data?.message || error.message || 'Failed to process Cashfree refund');
  }
};
