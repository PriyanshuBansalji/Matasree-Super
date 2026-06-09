import { Request, Response, NextFunction } from 'express';
/**
 * MongoDB NoSQL injection prevention
 * Strips $ and . from user input to prevent query injection
 */
export declare const sanitizeMongo: import("express").Handler;
/**
 * HTTP Parameter Pollution protection
 * Prevents duplicate query parameters from being exploited
 * Whitelist allows specific params that legitimately use arrays
 */
export declare const preventHPP: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * XSS sanitizer middleware
 * Cleans all string values in body, query, and params
 */
export declare const xssSanitizer: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=sanitizer.d.ts.map