/**
 * Central Error Handler Middleware
 * Handles all errors with consistent response format
 * Differentiates between operational and programming errors
 */
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/response';
import logger from '../config/logger';

/**
 * Custom AppError class for operational errors
 * These are expected errors (validation, auth, not found)
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors: any[];

  constructor(statusCode: number, message: string, errors: any[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Handle Mongoose CastError (invalid ObjectId)
 */
const handleCastError = (err: any): AppError => {
  return new AppError(400, `Invalid ${err.path}: ${err.value}`);
};

/**
 * Handle Mongoose duplicate key error
 */
const handleDuplicateKeyError = (err: any): AppError => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(
    400,
    `Duplicate value for '${field}'. This ${field} is already in use.`
  );
};

/**
 * Handle Mongoose validation error
 */
const handleValidationError = (err: any): AppError => {
  const errors = Object.values(err.errors).map((e: any) => e.message);
  return new AppError(400, 'Validation failed', errors);
};

/**
 * Handle JWT errors
 */
const handleJWTError = (): AppError =>
  new AppError(401, 'Invalid token. Please log in again.');

const handleJWTExpiredError = (): AppError =>
  new AppError(401, 'Token expired. Please log in again.');

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let err = { ...error };
  err.message = error.message;
  err.statusCode = error.statusCode || 500;

  // Log error details
  logger.error(`[${req.method}] ${req.originalUrl} - ${err.statusCode}: ${err.message}`, {
    stack: error.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Handle specific MongoDB/Mongoose errors
  if (error.name === 'CastError') err = handleCastError(error);
  if (error.code === 11000) err = handleDuplicateKeyError(error);
  if (error.name === 'ValidationError') err = handleValidationError(error);
  if (error.name === 'JsonWebTokenError') err = handleJWTError();
  if (error.name === 'TokenExpiredError') err = handleJWTExpiredError();

  // Operational errors: send full message to client
  if (err.isOperational || error.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
      statusCode: err.statusCode,
    });
  }

  // Programming/unknown errors: don't leak details in production
  const statusCode = err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message,
    statusCode,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404,
  });
};
