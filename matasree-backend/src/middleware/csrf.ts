import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ApiResponse } from '../utils/response';

/**
 * Double-submit cookie CSRF protection middleware.
 * Generates a CSRF token and sets it as a cookie for GET/safe requests.
 * Validates the cookie token against the X-CSRF-Token header for state-changing requests.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  // Exclude non-state-changing requests
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  
  // Exclude endpoints that use their own authentication mechanism (HttpOnly cookie, etc.)
  // /auth/refresh-token is protected by the HttpOnly refresh token cookie — inherently CSRF-safe.
  // /auth/login and /auth/register bootstrap a new session, so there's no existing session to hijack.
  // /auth/logout doesn't require CSRF since it doesn't access private data (just clears session).
  // OAuth callbacks are triggered externally (browser redirect, not XHR).
  const isExcluded =
    req.path.includes('/google/callback') ||
    req.path.includes('/github/callback') ||
    req.path.includes('/refresh-token') ||
    req.path.includes('/auth/login') ||
    req.path.includes('/auth/register') ||
    req.path.includes('/auth/logout');
  
  if (isExcluded) {
    return next();
  }

  const cookieToken = req.cookies?.['_csrf'];
  
  if (safeMethods.includes(req.method)) {
    // Generate new CSRF token if one doesn't exist
    if (!cookieToken) {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie('_csrf', token, {
        httpOnly: false, // Accessible by frontend JS to extract and send as a header
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/'
      });
    }
    return next();
  }

  // Validate CSRF token for POST, PUT, DELETE, PATCH, etc.
  const headerToken = req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'];
  
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json(new ApiResponse(false, 'Invalid or missing CSRF token', null, 403));
  }

  next();
};
