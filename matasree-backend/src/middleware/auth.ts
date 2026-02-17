import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, ITokenPayload } from '../utils/jwt';
import { ApiError } from '../utils/response';

export interface AuthenticatedRequest extends Request {
  user?: ITokenPayload;
}

// Verify JWT token
export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'No token provided');
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

// Verify Admin role
export const verifyAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Admin access required'));
  }
  next();
};

// Verify Customer role
export const verifyCustomer = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'customer') {
    return next(new ApiError(403, 'Customer access required'));
  }
  next();
};
