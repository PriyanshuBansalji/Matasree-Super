import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import logger from '../config/logger';

/**
 * Express middleware to cache responses in Redis.
 * Only caches GET requests with successful 2xx responses.
 */
export const cacheMiddleware = (ttlSeconds: number, cacheKeyPrefix: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Bypass cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Build unique cache key incorporating request path and query parameters
    const queryStr = JSON.stringify(req.query);
    const key = `cache:${cacheKeyPrefix}:${req.originalUrl || req.url}:${queryStr}`;

    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        logger.debug(`⚡ Cache hit: ${key}`);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        return res.send(cachedData);
      }

      logger.debug(`⚡ Cache miss: ${key}`);
      res.setHeader('X-Cache', 'MISS');

      // Intercept the response send method
      const originalSend = res.send;
      res.send = function (body): Response {
        res.send = originalSend; // Restore original

        // Cache the response body if status is 2xx and body is a string (JSON response)
        if (res.statusCode >= 200 && res.statusCode < 300 && typeof body === 'string') {
          redisClient.set(key, body, 'EX', ttlSeconds).catch(err => {
            logger.error(`Failed to write cache for key ${key}:`, err.message);
          });
        }

        return originalSend.call(this, body);
      };

      next();
    } catch (error: any) {
      logger.error('Cache middleware error:', error.message);
      next(); // Fail open: proceed to route handler if cache is down
    }
  };
};

/**
 * Helper function to invalidate cache entries by key pattern.
 */
export const invalidateCachePattern = async (pattern: string) => {
  try {
    const keys = await redisClient.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
      logger.info(`⚡ Cache invalidated: ${keys.length} keys matching pattern: cache:${pattern}`);
    }
  } catch (error: any) {
    logger.error(`Failed to invalidate cache pattern cache:${pattern}:`, error.message);
  }
};
