"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorizeRoles = exports.verifyCustomer = exports.verifyAdmin = exports.verifyToken = void 0;
const jwt_1 = require("../utils/jwt");
const errorHandler_1 = require("./errorHandler");
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Verify JWT access token from Authorization header
 * Extracts and validates Bearer token, attaches user to request
 */
const verifyToken = (req, res, next) => {
    try {
        // Try Authorization header first
        const authHeader = req.headers.authorization;
        let token;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        if (!token) {
            throw new errorHandler_1.AppError(401, 'Authentication required. Please log in.');
        }
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new errorHandler_1.AppError(401, 'Token expired. Please refresh your session.'));
        }
        if (error.name === 'JsonWebTokenError') {
            return next(new errorHandler_1.AppError(401, 'Invalid token. Please log in again.'));
        }
        next(error instanceof errorHandler_1.AppError ? error : new errorHandler_1.AppError(401, 'Authentication failed'));
    }
};
exports.verifyToken = verifyToken;
/**
 * Verify Admin role
 * Must be used AFTER verifyToken middleware
 */
const verifyAdmin = (req, res, next) => {
    const authReq = req;
    if (!authReq.user || authReq.user.role !== 'admin') {
        logger_1.default.warn(`Unauthorized admin access attempt by user: ${authReq.user?.userId}`);
        return next(new errorHandler_1.AppError(403, 'Admin access required'));
    }
    next();
};
exports.verifyAdmin = verifyAdmin;
/**
 * Verify Customer role
 * Must be used AFTER verifyToken middleware
 */
const verifyCustomer = (req, res, next) => {
    const authReq = req;
    if (!authReq.user || authReq.user.role !== 'customer') {
        return next(new errorHandler_1.AppError(403, 'Customer access required'));
    }
    next();
};
exports.verifyCustomer = verifyCustomer;
/**
 * Role-based access middleware factory
 * Usage: authorizeRoles('admin', 'customer')
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        const authReq = req;
        if (!authReq.user || !roles.includes(authReq.user.role)) {
            logger_1.default.warn(`Role-based access denied for user ${authReq.user?.userId}. Required: ${roles.join(', ')}`);
            return next(new errorHandler_1.AppError(403, `Access denied. Required role: ${roles.join(' or ')}`));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
/**
 * Optional auth - attaches user if token present, continues either way
 * Useful for endpoints that work for both authenticated and anonymous users
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            req.user = decoded;
        }
    }
    catch {
        // Token invalid or expired - continue without auth
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map