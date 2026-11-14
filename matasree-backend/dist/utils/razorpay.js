"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRazorpayRefund = exports.fetchRazorpayPayment = exports.verifyRazorpayWebhookSignature = exports.verifyRazorpaySignature = exports.createRazorpayOrder = exports.razorpayInstance = void 0;
const crypto_1 = __importDefault(require("crypto"));
// Use require to avoid TypeScript module resolution issues with razorpay package
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RazorpayLib = require('razorpay');
exports.razorpayInstance = new RazorpayLib({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});
const createRazorpayOrder = async (amount, orderId) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || keyId === 'your_key_id' || !keySecret || keySecret === 'your_key_secret') {
        throw new Error('Razorpay is not configured. Please use Cash on Delivery or contact support.');
    }
    const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: orderId,
    };
    return exports.razorpayInstance.orders.create(options);
};
exports.createRazorpayOrder = createRazorpayOrder;
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret)
        return false;
    const shasum = crypto_1.default.createHmac('sha256', secret);
    shasum.update(`${orderId}|${paymentId}`);
    const digest = shasum.digest('hex');
    return digest === signature;
};
exports.verifyRazorpaySignature = verifyRazorpaySignature;
/**
 * Verify Razorpay Webhook HMAC SHA256 signature
 */
const verifyRazorpayWebhookSignature = (payloadBody, signature, secret) => {
    const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!webhookSecret)
        return false;
    const expectedSignature = crypto_1.default
        .createHmac('sha256', webhookSecret)
        .update(payloadBody)
        .digest('hex');
    return expectedSignature === signature;
};
exports.verifyRazorpayWebhookSignature = verifyRazorpayWebhookSignature;
/**
 * Fetch Payment details from Razorpay API
 */
const fetchRazorpayPayment = async (paymentId) => {
    return exports.razorpayInstance.payments.fetch(paymentId);
};
exports.fetchRazorpayPayment = fetchRazorpayPayment;
/**
 * Issue Refund via Razorpay Refund API
 */
const createRazorpayRefund = async (paymentId, amount, // in INR (optional - full refund if omitted)
notes) => {
    const options = { notes: notes || {} };
    if (amount && amount > 0) {
        options.amount = Math.round(amount * 100); // Convert to paise
    }
    return exports.razorpayInstance.payments.refund(paymentId, options);
};
exports.createRazorpayRefund = createRazorpayRefund;
//# sourceMappingURL=razorpay.js.map