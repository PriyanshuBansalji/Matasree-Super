import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/response';

// Global error handler
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  console.error(`[Error] ${statusCode}: ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || [],
    statusCode,
  });
};

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404,
  });
};
