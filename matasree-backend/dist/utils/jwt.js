"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateAccessToken = (userId, email, role) => {
    const secret = (process.env.JWT_SECRET || 'default_secret');
    return jsonwebtoken_1.default.sign({ userId, email, role }, secret, {
        expiresIn: (process.env.JWT_EXPIRE || '7d'),
    });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId) => {
    const secret = (process.env.JWT_REFRESH_SECRET || 'default_refresh_secret');
    return jsonwebtoken_1.default.sign({ userId }, secret, {
        expiresIn: (process.env.JWT_REFRESH_EXPIRE || '30d'),
    });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    const secret = (process.env.JWT_SECRET || 'default_secret');
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    const secret = (process.env.JWT_REFRESH_SECRET || 'default_refresh_secret');
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyRefreshToken = verifyRefreshToken;
//# sourceMappingURL=jwt.js.map