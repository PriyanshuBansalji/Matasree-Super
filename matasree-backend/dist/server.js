"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Matasree Super - Express Server
 * Production-ready with security middleware, OAuth, structured logging
 */
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const sanitizer_1 = require("./middleware/sanitizer");
const passport_1 = __importStar(require("./config/passport"));
const logger_1 = __importDefault(require("./config/logger"));
// Routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const addressRoutes_1 = __importDefault(require("./routes/addressRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const emailRoutes_1 = __importDefault(require("./routes/emailRoutes"));
const partnershipRoutes_1 = __importDefault(require("./routes/partnershipRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const couponRoutes_1 = __importDefault(require("./routes/couponRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
// Helmet - HTTP security headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:", "http:", "res.cloudinary.com"],
            mediaSrc: ["'self'", "data:"],
            fontSrc: ["'self'", "https:", "data:"],
            connectSrc: ["'self'", "https://accounts.google.com", "https://github.com"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
// CORS - allow frontend origins
const allowedOrigins = [
    'http://localhost:8000', // Frontend dev (Vite)
    'http://localhost:8001', // Frontend dev (Vite alt)
    'http://127.0.0.1:8000', // Frontend dev (alt)
    'http://127.0.0.1:8001', // Frontend dev (alt)
    'http://localhost:5001', // Backend self
    process.env.FRONTEND_URL || 'http://localhost:8000',
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        logger_1.default.warn(`CORS blocked request from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Cookie parser for HTTP-only refresh token cookies
app.use((0, cookie_parser_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
});
// Stricter rate limit for auth routes
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per window
    message: 'Too many auth attempts. Please try again later.',
});
app.use(limiter);
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
// Request sanitization
app.use(sanitizer_1.sanitizeMongo); // NoSQL injection prevention
app.use(sanitizer_1.preventHPP); // HTTP Parameter Pollution prevention
app.use(sanitizer_1.xssSanitizer); // XSS prevention
// ============================================================
// PASSPORT OAUTH
// ============================================================
app.use(passport_1.default.initialize());
(0, passport_1.initializePassport)();
// ============================================================
// REQUEST LOGGING
// ============================================================
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.default.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
        });
    });
    next();
});
// ============================================================
// STATIC FILES
// ============================================================
const uploadsPath = path_1.default.join(__dirname, '..', 'uploads');
app.use('/uploads', express_1.default.static(uploadsPath, {
    maxAge: '1d',
    etag: true,
    setHeaders: (res) => {
        res.header('Cache-Control', 'public, max-age=86400');
        res.header('Access-Control-Allow-Origin', '*');
    },
}));
// Image proxy with directory traversal protection
app.get('/api/images/*', (req, res) => {
    const imagePath = req.path.replace('/api/images/', '');
    const fullPath = path_1.default.join(uploadsPath, imagePath);
    // Security: prevent directory traversal
    if (!fullPath.startsWith(uploadsPath)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Cache-Control', 'public, max-age=86400');
    res.sendFile(fullPath, (err) => {
        if (err) {
            logger_1.default.error(`Image file not found: ${fullPath}`);
        }
    });
    return;
});
// ============================================================
// API ROUTES
// ============================================================
app.use('/api/auth', authLimiter, authRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/categories', categoryRoutes_1.default);
app.use('/api/cart', cartRoutes_1.default);
app.use('/api/addresses', addressRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/email', emailRoutes_1.default);
app.use('/api/partnership', partnershipRoutes_1.default);
app.use('/api/reviews', reviewRoutes_1.default);
app.use('/api/coupons', couponRoutes_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Matasree API is running',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
// ============================================================
// SERVER STARTUP
// ============================================================
const startServer = async () => {
    try {
        await (0, database_1.connectDB)();
        app.listen(PORT, () => {
            logger_1.default.info(`✅ Server running on http://localhost:${PORT}`);
            logger_1.default.info(`📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8000'}`);
            logger_1.default.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        logger_1.default.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
if (process.env.NODE_ENV !== 'test') {
    startServer();
}
exports.default = app;
//# sourceMappingURL=server.js.map