import Razorpay from 'razorpay';

export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export const createRazorpayOrder = async (amount: number, orderId: string) => {
  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency: 'INR',
    receipt: orderId,
  };

  return razorpayInstance.orders.create(options);
};

export const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const crypto = require('crypto');
  const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string);
  shasum.update(`${orderId}|${paymentId}`);
  const digest = shasum.digest('hex');
  return digest === signature;
};
