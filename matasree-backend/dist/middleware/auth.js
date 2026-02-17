"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCustomer = exports.verifyAdmin = exports.verifyToken = void 0;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
// Verify JWT token
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new response_1.ApiError(401, 'No token provided');
        }
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        next(new response_1.ApiError(401, 'Invalid or expired token'));
    }
};
exports.verifyToken = verifyToken;
// Verify Admin role
const verifyAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return next(new response_1.ApiError(403, 'Admin access required'));
    }
    next();
};
exports.verifyAdmin = verifyAdmin;
// Verify Customer role
const verifyCustomer = (req, res, next) => {
    if (!req.user || req.user.role !== 'customer') {
        return next(new response_1.ApiError(403, 'Customer access required'));
    }
    next();
};
exports.verifyCustomer = verifyCustomer;
//# sourceMappingURL=auth.js.map