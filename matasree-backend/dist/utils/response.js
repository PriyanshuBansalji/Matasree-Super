"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.ApiResponse = void 0;
// API Response wrapper for consistent responses
class ApiResponse {
    constructor(success, message, data, statusCode = 200) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.statusCode = statusCode;
    }
}
exports.ApiResponse = ApiResponse;
// API Error response
class ApiError extends Error {
    constructor(statusCode, message, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=response.js.map