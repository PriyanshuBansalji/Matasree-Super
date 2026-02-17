"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpaySignature = exports.createRazorpayOrder = exports.razorpayInstance = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
exports.razorpayInstance = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const createRazorpayOrder = async (amount, orderId) => {
    const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: orderId,
    };
    return exports.razorpayInstance.orders.create(options);
};
exports.createRazorpayOrder = createRazorpayOrder;
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
    const crypto = require('crypto');
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${orderId}|${paymentId}`);
    const digest = shasum.digest('hex');
    return digest === signature;
};
exports.verifyRazorpaySignature = verifyRazorpaySignature;
//# sourceMappingURL=razorpay.js.map