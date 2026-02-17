import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { connectDB } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
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
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL || 'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static files for uploads - use absolute path
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath, {
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
  const fullPath = path.join(uploadsPath, imagePath);

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
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/partnership', partnershipRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
