/**
 * Authentication Middleware
 * Supports JWT from:
 * 1. Authorization Bearer header
 * 2. HTTP-only cookies (refresh tokens)
 * Role-based access control (Admin / Customer)
 */
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ITokenPayload } from '../utils/jwt';
export interface AuthenticatedRequest extends Request {
    user?: ITokenPayload;
}
/**
 * Verify JWT access token from Authorization header
 * Extracts and validates Bearer token, attaches user to request
 */
export declare const verifyToken: RequestHandler;
/**
 * Verify Admin role
 * Must be used AFTER verifyToken middleware
 */
export declare const verifyAdmin: RequestHandler;
/**
 * Verify Customer role
 * Must be used AFTER verifyToken middleware
 */
export declare const verifyCustomer: RequestHandler;
/**
 * Role-based access middleware factory
 * Usage: authorizeRoles('admin', 'customer')
 */
export declare const authorizeRoles: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional auth - attaches user if token present, continues either way
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export declare const optionalAuth: RequestHandler;
//# sourceMappingURL=auth.d.ts.map