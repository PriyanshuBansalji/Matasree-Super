"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
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
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            mediaSrc: ["'self'", "data:"],
            fontSrc: ["'self'", "https:", "data:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8080',
        process.env.FRONTEND_URL || 'http://localhost:8080'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
// Static files for uploads - use absolute path
const uploadsPath = path_1.default.join(__dirname, '..', 'uploads');
app.use('/uploads', express_1.default.static(uploadsPath, {
    maxAge: '1d',
    etag: false,
    setHeaders: (res) => {
        res.header('Cache-Control', 'public, max-age=86400');
        res.header('Access-Control-Allow-Origin', '*');
    },
}));
console.log('📁 Serving static files from:', uploadsPath);
// Image proxy endpoint with explicit CORS headers
app.get('/api/images/*', (req, res) => {
    const imagePath = req.path.replace('/api/images/', '');
    const fullPath = path_1.default.join(uploadsPath, imagePath);
    // Security: prevent directory traversal
    if (!fullPath.startsWith(uploadsPath)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    // Set explicit CORS headers for images
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Cache-Control', 'public, max-age=86400');
    res.sendFile(fullPath, (err) => {
        if (err) {
            console.error('❌ Image file not found:', fullPath);
            res.status(404).json({ error: 'Image not found' });
        }
    });
});
// API Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/categories', categoryRoutes_1.default);
app.use('/api/cart', cartRoutes_1.default);
app.use('/api/addresses', addressRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/email', emailRoutes_1.default);
app.use('/api/partnership', partnershipRoutes_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is running' });
});
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
// Connect to database and start server
const startServer = async () => {
    try {
        await (0, database_1.connectDB)();
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map