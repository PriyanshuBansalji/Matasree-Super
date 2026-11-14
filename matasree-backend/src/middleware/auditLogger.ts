import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import { AuthenticatedRequest } from './auth';

/**
 * Recursively redacts sensitive parameters from request payloads before logging.
 */
const redactSensitiveData = (data: any): any => {
  if (!data) return data;
  const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken', 'newPassword', 'bankAccountNumber', 'ifscCode', 'otp'];

  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(redactSensitiveData(parsed));
    } catch {
      return data;
    }
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof data[key] === 'object') {
        cleaned[key] = redactSensitiveData(data[key]);
      } else {
        cleaned[key] = data[key];
      }
    }
    return cleaned;
  }

  return data;
};

/**
 * Log a standalone security/audit event.
 */
export const logSecurityEvent = async (
  userId: string | undefined,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, any>,
  req?: Request
) => {
  try {
    await AuditLog.create({
      userId,
      action,
      resource,
      resourceId,
      ipAddress: req?.ip || 'system',
      userAgent: req?.headers['user-agent'] || 'system',
      metadata: redactSensitiveData(metadata)
    });
  } catch (error: any) {
    console.error('Failed to write audit log:', error.message);
  }
};

/**
 * Express middleware factory to log state-changing route actions automatically.
 */
export const auditLogAction = (action: string, resource: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    res.on('finish', async () => {
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      const userId = authReq.user?.userId;

      await logSecurityEvent(
        userId,
        action,
        resource,
        req.params?.id || req.body?.id || undefined,
        {
          success: isSuccess,
          status: res.statusCode,
          method: req.method,
          url: req.originalUrl,
          payload: req.method !== 'GET' ? req.body : undefined
        },
        req
      );
    });

    next();
  };
};
