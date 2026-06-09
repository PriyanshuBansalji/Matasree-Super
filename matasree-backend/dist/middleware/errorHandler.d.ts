/**
 * Central Error Handler Middleware
 * Handles all errors with consistent response format
 * Differentiates between operational and programming errors
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Custom AppError class for operational errors
 * These are expected errors (validation, auth, not found)
 */
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    errors: any[];
    constructor(statusCode: number, message: string, errors?: any[]);
}
/**
 * Global error handler middleware
 */
export declare const errorHandler: (error: any, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * 404 Not Found handler
 */
export declare const notFoundHandler: (req: Request, res: Response) => void;
//# sourceMappingURL=errorHandler.d.ts.map