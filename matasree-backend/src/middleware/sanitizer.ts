/**
 * Request Sanitizer Middleware
 * Protects against NoSQL injection and XSS attacks
 * Cleans request body, query, and params
 */
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { Request, Response, NextFunction } from 'express';

/**
 * MongoDB NoSQL injection prevention
 * Strips $ and . from user input to prevent query injection
 */
export const sanitizeMongo = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }: { req: Request; key: string }) => {
    console.warn(`🛡️  Sanitized NoSQL injection attempt in ${key}`);
  },
});

/**
 * HTTP Parameter Pollution protection
 * Prevents duplicate query parameters from being exploited
 * Whitelist allows specific params that legitimately use arrays
 */
export const preventHPP = hpp({
  whitelist: [
    'price',
    'rating',
    'category',
    'sort',
    'fields',
    'page',
    'limit',
  ],
});

/**
 * Basic XSS cleaner for string values
 * Strips HTML tags and script injections
 */
const cleanXSS = (value: string): string => {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Deep sanitize an object's string values
 */
const deepSanitize = (obj: any): any => {
  if (typeof obj === 'string') return cleanXSS(obj);
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = deepSanitize(obj[key]);
    }
    return sanitized;
  }
  return obj;
};

/**
 * XSS sanitizer middleware
 * Cleans all string values in body, query, and params
 */
export const xssSanitizer = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) req.body = deepSanitize(req.body);
  if (req.query) req.query = deepSanitize(req.query);
  if (req.params) req.params = deepSanitize(req.params);
  next();
};
