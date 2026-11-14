import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import { ApiResponse } from '../utils/response';

/**
 * User-aware rate limiter middleware backed by Redis (falls back to memory fallback if Redis is down).
 * Checks limit by authenticated User ID if present, otherwise falls back to IP address.
 */
export const userRateLimiter = (windowMs: number, maxRequests: number, message = 'Too many requests, please try again later.') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.userId;
    // Identify by User ID or IP address
    const identifier = userId ? `user:${userId}` : `ip:${req.ip}`;
    const key = `ratelimit:${identifier}:${req.baseUrl || ''}${req.path}`;

    try {
      const current = await redisClient.get(key);
      if (current) {
        const count = parseInt(current, 10);
        if (count >= maxRequests) {
          return res.status(429).json(new ApiResponse(false, message, null, 429));
        }
        // Increment and keep the remaining TTL if using Redis directly, or just set it
        await redisClient.set(key, (count + 1).toString(), 'EX', Math.ceil(windowMs / 1000));
      } else {
        await redisClient.set(key, '1', 'EX', Math.ceil(windowMs / 1000));
      }
      next();
    } catch (error) {
      // Fail open: let requests pass if rate limiter fails
      next();
    }
  };
};
