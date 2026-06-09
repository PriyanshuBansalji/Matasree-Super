"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Custom AppError class for operational errors
 * These are expected errors (validation, auth, not found)
 */
class AppError extends Error {
    constructor(statusCode, message, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errors = errors;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
/**
 * Handle Mongoose CastError (invalid ObjectId)
 */
const handleCastError = (err) => {
    return new AppError(400, `Invalid ${err.path}: ${err.value}`);
};
/**
 * Handle Mongoose duplicate key error
 */
const handleDuplicateKeyError = (err) => {
    const field = Object.keys(err.keyValue)[0];
    return new AppError(400, `Duplicate value for '${field}'. This ${field} is already in use.`);
};
/**
 * Handle Mongoose validation error
 */
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map((e) => e.message);
    return new AppError(400, 'Validation failed', errors);
};
/**
 * Handle JWT errors
 */
const handleJWTError = () => new AppError(401, 'Invalid token. Please log in again.');
const handleJWTExpiredError = () => new AppError(401, 'Token expired. Please log in again.');
/**
 * Global error handler middleware
 */
const errorHandler = (error, req, res, next) => {
    let err = { ...error };
    err.message = error.message;
    err.statusCode = error.statusCode || 500;
    // Log error details
    logger_1.default.error(`[${req.method}] ${req.originalUrl} - ${err.statusCode}: ${err.message}`, {
        stack: error.stack,
        body: req.body,
        params: req.params,
        query: req.query,
    });
    // Handle specific MongoDB/Mongoose errors
    if (error.name === 'CastError')
        err = handleCastError(error);
    if (error.code === 11000)
        err = handleDuplicateKeyError(error);
    if (error.name === 'ValidationError')
        err = handleValidationError(error);
    if (error.name === 'JsonWebTokenError')
        err = handleJWTError();
    if (error.name === 'TokenExpiredError')
        err = handleJWTExpiredError();
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
exports.errorHandler = errorHandler;
/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        statusCode: 404,
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map