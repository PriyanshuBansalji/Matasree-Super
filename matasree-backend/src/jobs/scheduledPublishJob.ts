/**
 * Scheduled Publish Job
 *
 * Runs every minute to auto-publish scheduled products whose scheduledPublishAt timestamp has passed.
 * Invalidates products cache when items transition to active.
 *
 * Requirements: 18.1, 18.2, 18.3
 */
import cron from 'node-cron';
import Product from '../models/Product';
import logger from '../config/logger';
import { invalidateCachePattern } from '../middleware/cache';

/**
 * Execute a single run of the scheduled publish check.
 */
export const runScheduledPublishJob = async () => {
  try {
    const now = new Date();
    const result = await Product.updateMany(
      {
        status: 'scheduled',
        scheduledPublishAt: { $lte: now },
      },
      {
        $set: {
          status: 'active',
          scheduledPublishAt: null,
        },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`🚀 Auto-published ${result.modifiedCount} scheduled products`);
      await invalidateCachePattern('products:*');
    }
  } catch (error: any) {
    logger.error('Error running scheduled publish job:', error.message);
  }
};

/**
 * Initialize the cron schedule (runs every minute).
 */
export const initScheduledPublishJob = () => {
  logger.info('⏰ Initializing scheduled publish cron job (every 1 minute)');
  cron.schedule('* * * * *', async () => {
    await runScheduledPublishJob();
  });
};
