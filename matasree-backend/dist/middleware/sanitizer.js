"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xssSanitizer = exports.preventHPP = exports.sanitizeMongo = void 0;
/**
 * Request Sanitizer Middleware
 * Protects against NoSQL injection and XSS attacks
 * Cleans request body, query, and params
 */
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const hpp_1 = __importDefault(require("hpp"));
/**
 * MongoDB NoSQL injection prevention
 * Strips $ and . from user input to prevent query injection
 */
exports.sanitizeMongo = (0, express_mongo_sanitize_1.default)({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`🛡️  Sanitized NoSQL injection attempt in ${key}`);
    },
});
/**
 * HTTP Parameter Pollution protection
 * Prevents duplicate query parameters from being exploited
 * Whitelist allows specific params that legitimately use arrays
 */
exports.preventHPP = (0, hpp_1.default)({
    whitelist: [
        'price',
        'rating',
        'category',
        'sort',
        'fields',
        'page',
        'limit',
    ],
});
/**
 * Basic XSS cleaner for string values
 * Strips HTML tags and script injections
 */
const cleanXSS = (value) => {
    return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
};
/**
 * Deep sanitize an object's string values
 */
const deepSanitize = (obj) => {
    if (typeof obj === 'string')
        return cleanXSS(obj);
    if (Array.isArray(obj))
        return obj.map(deepSanitize);
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const key of Object.keys(obj)) {
            sanitized[key] = deepSanitize(obj[key]);
        }
        return sanitized;
    }
    return obj;
};
/**
 * XSS sanitizer middleware
 * Cleans all string values in body, query, and params
 */
const xssSanitizer = (req, res, next) => {
    if (req.body)
        req.body = deepSanitize(req.body);
    if (req.query)
        req.query = deepSanitize(req.query);
    if (req.params)
        req.params = deepSanitize(req.params);
    next();
};
exports.xssSanitizer = xssSanitizer;
//# sourceMappingURL=sanitizer.js.map