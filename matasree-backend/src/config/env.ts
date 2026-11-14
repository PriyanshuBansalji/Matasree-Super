/**
 * Environment Variable Validation & Configuration
 * Uses Zod to validate all required environment variables at startup
 * Prevents runtime errors from missing configuration
 */
import { z } from 'zod';
import logger from './logger';

const envSchema = z.object({
  // Server
  PORT: z.string().default('5001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:8000'),

  // JWT
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
  JWT_EXPIRE: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(10, 'JWT_REFRESH_SECRET must be at least 10 characters'),
  JWT_REFRESH_EXPIRE: z.string().default('7d'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('1000'),

  // OAuth - Google (optional in dev)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().default('/api/auth/google/callback'),

  // OAuth - GitHub (optional in dev)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().default('/api/auth/github/callback'),

  // Cloudinary (optional in dev)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587'),
  SMTP_SECURE: z.string().default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM_NAME: z.string().default('Matasree Super'),
  MAIL_FROM_ADDRESS: z.string().default('admin@matasreesuper.com'),
  REPLY_TO_ADDRESS: z.string().default('admin@matasreesuper.com'),
  EMAIL_SERVICE: z.string().default('smtp'),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  ADMIN_EMAIL: z.string().default('admin@matasreesuper.com'),

  // Payment (Cashfree Payments)
  CASHFREE_APP_ID: z.string().optional(),
  CASHFREE_SECRET_KEY: z.string().optional(),
  CASHFREE_ENVIRONMENT: z.string().default('SANDBOX'),
  CASHFREE_WEBHOOK_SECRET: z.string().optional(),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
});

/**
 * Validate and parse environment variables
 * Throws descriptive error if validation fails
 */
export const validateEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment variable validation failed:');
    result.error.issues.forEach((issue: any) => {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  return result.data;
};

export type EnvConfig = z.infer<typeof envSchema>;
export const env = validateEnv();

// ============================================================
// JWT WEAK-SECRET DETECTION
// Requirements: 30.1, 30.2, 30.3, 30.4, 30.5
// ============================================================

const WEAK_SECRETS = new Set([
  'secret',
  'your-secret-key',
  'changeme',
  'jwt_secret',
  'default_secret',
  'your_super_secret_jwt_key_here_change_in_production',
]);

/**
 * Validates that a JWT secret env var is not absent, empty, or a known-weak default.
 * In production: logs a fatal error and exits immediately.
 * In development/test: logs a warning so engineers know to change it before deploying.
 */
function validateJwtSecret(key: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): void {
  const value = process.env[key];
  const isWeak = !value || WEAK_SECRETS.has(value);
  if (!isWeak) return;
  if (process.env.NODE_ENV === 'production') {
    logger.error(`[FATAL] ${key} is a known weak default. Server startup aborted.`);
    process.exit(1);
  } else {
    logger.warn(`[WARN] ${key} is using a weak default value. Change it before deploying.`);
  }
}

validateJwtSecret('JWT_SECRET');
validateJwtSecret('JWT_REFRESH_SECRET');
