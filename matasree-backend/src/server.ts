/**
 * Matasree Super - Express Server
 * Production-ready with security middleware, OAuth, structured logging
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import { connectDB } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { sanitizeMongo, preventHPP, xssSanitizer } from './middleware/sanitizer';
import passport, { initializePassport } from './config/passport';
import logger from './config/logger';

// Jobs
import { initCartAbandonmentJob } from './jobs/cartAbandonmentJob';

// Routes
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import cartRoutes from './routes/cartRoutes';
import addressRoutes from './routes/addressRoutes';
import orderRoutes from './routes/orderRoutes';
import adminRoutes from './routes/adminRoutes';
import emailRoutes from './routes/emailRoutes';
import partnershipRoutes from './routes/partnershipRoutes';
import reviewRoutes from './routes/reviewRoutes';
import couponRoutes from './routes/couponRoutes';
import wishlistRoutes from './routes/wishlistRoutes';
import loyaltyRoutes from './routes/loyaltyRoutes';
import referralRoutes from './routes/referralRoutes';

const app = express();
const PORT = process.env.PORT || 5001;

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet - HTTP security headers
app.use(helmet({
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
  'http://localhost:8000',     // Frontend dev (Vite)
  'http://localhost:8001',     // Frontend dev (Vite alt)
  'http://localhost:8080',     // Frontend dev (Vite port 8080)
  'http://127.0.0.1:8000',    // Frontend dev (alt)
  'http://127.0.0.1:8001',    // Frontend dev (alt)
  'http://127.0.0.1:8080',    // Frontend dev (alt port 8080)
  'http://localhost:5001',     // Backend self
  process.env.FRONTEND_URL || 'http://localhost:8080',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    logger.warn(`CORS blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Cookie parser for HTTP-only refresh token cookies
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
});

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                  // 20 attempts per window
  message: 'Too many auth attempts. Please try again later.',
});

app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request sanitization
app.use(sanitizeMongo);  // NoSQL injection prevention
app.use(preventHPP);     // HTTP Parameter Pollution prevention
app.use(xssSanitizer);   // XSS prevention

// ============================================================
// PASSPORT OAUTH
// ============================================================
app.use(passport.initialize());
initializePassport();

// ============================================================
// REQUEST LOGGING
// ============================================================
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
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
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath, {
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
  const fullPath = path.join(uploadsPath, imagePath);

  // Security: prevent directory traversal
  if (!fullPath.startsWith(uploadsPath)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Cache-Control', 'public, max-age=86400');

  res.sendFile(fullPath, (err) => {
    if (err) {
      logger.error(`Image file not found: ${fullPath}`);
    }
  });

  return;
});

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/partnership', partnershipRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/referral', referralRoutes);

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
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// ============================================================
// SERVER STARTUP
// ============================================================
const startServer = async () => {
  try {
    await connectDB();
    initCartAbandonmentJob();
    app.listen(PORT, () => {
      logger.info(`✅ Server running on http://localhost:${PORT}`);
      logger.info(`📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
