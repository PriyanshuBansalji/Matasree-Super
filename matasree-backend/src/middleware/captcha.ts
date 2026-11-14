import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { ApiResponse } from '../utils/response';
import logger from '../config/logger';

/**
 * Google reCAPTCHA v3 verification middleware.
 * Verifies captchaToken sent in request body or X-Captcha-Token header.
 */
export const verifyCaptcha = async (req: Request, res: Response, next: NextFunction) => {
  // Skip CAPTCHA check in non-production environments if keys are missing
  if (process.env.NODE_ENV !== 'production' && !process.env.RECAPTCHA_SECRET_KEY) {
    return next();
  }

  const token = req.body.captchaToken || req.headers['x-captcha-token'];

  if (!token) {
    return res.status(400).json(new ApiResponse(false, 'Missing CAPTCHA verification token', null, 400));
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token,
          remoteip: req.ip
        }
      }
    );

    const { success, score } = response.data;

    if (!success || (score !== undefined && score < 0.5)) {
      logger.warn(`CAPTCHA verification failed. Success: ${success}, Score: ${score}`);
      return res.status(403).json(new ApiResponse(false, 'CAPTCHA verification failed. Please try again.', null, 403));
    }

    next();
  } catch (error: any) {
    logger.error('CAPTCHA verification error:', error.message);
    // Gracefully proceed if reCAPTCHA service is unreachable, to avoid locking out legitimate users
    return next();
  }
};
