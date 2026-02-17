"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
// Global error handler
const errorHandler = (error, req, res, next) => {
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
exports.errorHandler = errorHandler;
// 404 Not Found handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        statusCode: 404,
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map