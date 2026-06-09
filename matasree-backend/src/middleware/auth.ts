/**
 * Authentication Middleware
 * Supports JWT from:
 * 1. Authorization Bearer header
 * 2. HTTP-only cookies (refresh tokens)
 * Role-based access control (Admin / Customer)
 */
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccessToken, ITokenPayload } from '../utils/jwt';
import { AppError } from './errorHandler';
import logger from '../config/logger';

export interface AuthenticatedRequest extends Request {
  user?: ITokenPayload;
}

/**
 * Verify JWT access token from Authorization header
 * Extracts and validates Bearer token, attaches user to request
 */
export const verifyToken: RequestHandler = (req, res, next) => {
  try {
    // Try Authorization header first
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      throw new AppError(401, 'Authentication required. Please log in.');
    }

    const decoded = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError(401, 'Token expired. Please refresh your session.'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError(401, 'Invalid token. Please log in again.'));
    }
    next(error instanceof AppError ? error : new AppError(401, 'Authentication failed'));
  }
};

/**
 * Verify Admin role
 * Must be used AFTER verifyToken middleware
 */
export const verifyAdmin: RequestHandler = (req, res, next) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || authReq.user.role !== 'admin') {
    logger.warn(`Unauthorized admin access attempt by user: ${authReq.user?.userId}`);
    return next(new AppError(403, 'Admin access required'));
  }
  next();
};

/**
 * Verify Customer role
 * Must be used AFTER verifyToken middleware
 */
export const verifyCustomer: RequestHandler = (req, res, next) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || authReq.user.role !== 'customer') {
    return next(new AppError(403, 'Customer access required'));
  }
  next();
};

/**
 * Role-based access middleware factory
 * Usage: authorizeRoles('admin', 'customer')
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user || !roles.includes(authReq.user.role)) {
      logger.warn(`Role-based access denied for user ${authReq.user?.userId}. Required: ${roles.join(', ')}`);
      return next(new AppError(403, `Access denied. Required role: ${roles.join(' or ')}`));
    }
    next();
  };
};

/**
 * Optional auth - attaches user if token present, continues either way
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export const optionalAuth: RequestHandler = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      (req as AuthenticatedRequest).user = decoded;
    }
  } catch {
    // Token invalid or expired - continue without auth
  }
  next();
};
