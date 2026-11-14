import cron from 'node-cron';
import Order from '../models/Order';
import Product from '../models/Product';
import logger from '../config/logger';

/**
 * Stock Release Job
 *
 * Runs every 2 minutes via node-cron to find expired Cashfree online orders
 * and restore their reserved stock.
 */
export const startStockReleaseJob = (): void => {
  // Run every 2 minutes
  cron.schedule('*/2 * * * *', async () => {
    try {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

      // Find pending online payment orders where stock was reserved more than 15 minutes ago
      const expiredOrders = await Order.find({
        paymentMethod: { $in: ['cashfree', 'razorpay'] },
        paymentStatus: 'pending',
        stockReservedAt: { $ne: null, $lte: fifteenMinutesAgo },
      });

      if (expiredOrders.length === 0) {
        return;
      }

      logger.info(`[StockReleaseJob] Found ${expiredOrders.length} expired online orders to release stock.`);

      for (const order of expiredOrders) {
        try {
          // Restore stock and decrement sold count for all items
          for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: item.quantity, sold: -item.quantity },
            });
          }

          // Mark order as failed / cancelled and clear stockReservedAt
          order.paymentStatus = 'failed';
          order.orderstatus = 'cancelled';
          order.stockReservedAt = null;
          await order.save();

          logger.info(`[StockReleaseJob] Released stock for order: ${order.orderNumber}`);
        } catch (orderError: any) {
          logger.error(`[StockReleaseJob] Error releasing stock for order ${order._id}:`, orderError.message);
        }
      }
    } catch (err: any) {
      logger.error('[StockReleaseJob] Fatal error during run:', err.message);
    }
  });

  logger.info('✅ [StockReleaseJob] Scheduled (every 2 minutes)');
};
