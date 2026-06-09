/**
 * Async Handler Middleware
 * Wraps async route handlers to automatically catch errors
 * Eliminates try-catch boilerplate in controllers
 */
import { Request, Response, NextFunction } from 'express';
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * Wraps an async function and forwards any errors to Express error handler
 * Usage: router.get('/route', asyncHandler(myController));
 */
export declare const asyncHandler: (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=asyncHandler.d.ts.map