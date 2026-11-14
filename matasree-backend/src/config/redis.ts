import Redis from 'ioredis';
import logger from './logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Simple in-memory fallback store in case Redis is not available/reachable
class MemoryFallback {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string> {
    let expiresAt: number | null = null;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    } else if (mode === 'PX' && duration) {
      expiresAt = Date.now() + duration;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const result: string[] = [];
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && item.expiresAt < now) {
        this.store.delete(key);
        continue;
      }
      if (regexPattern.test(key)) {
        result.push(key);
      }
    }
    return result;
  }
}

interface IRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: 'EX', duration?: number): Promise<string>;
  del(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  isUsingFallback(): boolean;
}

class RedisClientWrapper implements IRedisClient {
  private client: Redis | null = null;
  private fallback = new MemoryFallback();
  private useFallback = true;

  constructor() {
    this.init();
  }

  private init() {
    try {
      logger.info(`🔌 Connecting to Redis at ${REDIS_URL}...`);
      this.client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 5000,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('⚠️ Redis connection failed. Falling back to in-memory store.');
            this.useFallback = true;
            return null; // Stop retrying
          }
          return Math.min(times * 100, 2000);
        }
      });

      this.client.on('connect', () => {
        logger.info('✅ Connected to Redis successfully');
        this.useFallback = false;
      });

      this.client.on('error', (err) => {
        logger.error('❌ Redis error:', err.message);
        this.useFallback = true;
      });
    } catch (err: any) {
      logger.error('❌ Failed to initialize Redis client:', err.message);
      this.useFallback = true;
    }
  }

  isUsingFallback(): boolean {
    return this.useFallback;
  }

  async get(key: string): Promise<string | null> {
    if (this.useFallback || !this.client) {
      return this.fallback.get(key);
    }
    try {
      return await this.client.get(key);
    } catch (err: any) {
      logger.error(`Redis GET error for key ${key}:`, err.message);
      return this.fallback.get(key);
    }
  }

  async set(key: string, value: string, mode?: 'EX', duration?: number): Promise<string> {
    if (this.useFallback || !this.client) {
      return this.fallback.set(key, value, mode, duration);
    }
    try {
      if (mode === 'EX' && duration !== undefined) {
        return await this.client.set(key, value, 'EX', duration);
      }
      return await this.client.set(key, value);
    } catch (err: any) {
      logger.error(`Redis SET error for key ${key}:`, err.message);
      return this.fallback.set(key, value, mode, duration);
    }
  }

  async del(key: string): Promise<number> {
    if (this.useFallback || !this.client) {
      return this.fallback.del(key);
    }
    try {
      return await this.client.del(key);
    } catch (err: any) {
      logger.error(`Redis DEL error for key ${key}:`, err.message);
      return this.fallback.del(key);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.useFallback || !this.client) {
      return this.fallback.keys(pattern);
    }
    try {
      return await this.client.keys(pattern);
    } catch (err: any) {
      logger.error(`Redis KEYS error for pattern ${pattern}:`, err.message);
      return this.fallback.keys(pattern);
    }
  }
}

export const redisClient = new RedisClientWrapper();
