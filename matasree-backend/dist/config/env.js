"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.validateEnv = void 0;
/**
 * Environment Variable Validation & Configuration
 * Uses Zod to validate all required environment variables at startup
 * Prevents runtime errors from missing configuration
 */
const zod_1 = require("zod");
const logger_1 = __importDefault(require("./logger"));
const envSchema = zod_1.z.object({
    // Server
    PORT: zod_1.z.string().default('5001'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    // Database
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required'),
    // Frontend
    FRONTEND_URL: zod_1.z.string().default('http://localhost:8000'),
    // JWT
    JWT_SECRET: zod_1.z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
    JWT_EXPIRE: zod_1.z.string().default('15m'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(10, 'JWT_REFRESH_SECRET must be at least 10 characters'),
    JWT_REFRESH_EXPIRE: zod_1.z.string().default('7d'),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().default('1000'),
    // OAuth - Google (optional in dev)
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    GOOGLE_CALLBACK_URL: zod_1.z.string().default('/api/auth/google/callback'),
    // OAuth - GitHub (optional in dev)
    GITHUB_CLIENT_ID: zod_1.z.string().optional(),
    GITHUB_CLIENT_SECRET: zod_1.z.string().optional(),
    GITHUB_CALLBACK_URL: zod_1.z.string().default('/api/auth/github/callback'),
    // Cloudinary (optional in dev)
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().optional(),
    CLOUDINARY_API_KEY: zod_1.z.string().optional(),
    CLOUDINARY_API_SECRET: zod_1.z.string().optional(),
    // Email
    EMAIL_SERVICE: zod_1.z.string().default('gmail'),
    EMAIL_USER: zod_1.z.string().optional(),
    EMAIL_PASSWORD: zod_1.z.string().optional(),
    ADMIN_EMAIL: zod_1.z.string().optional(),
    // Payment
    RAZORPAY_KEY_ID: zod_1.z.string().optional(),
    RAZORPAY_KEY_SECRET: zod_1.z.string().optional(),
    // SMS (Twilio)
    TWILIO_ACCOUNT_SID: zod_1.z.string().optional(),
    TWILIO_AUTH_TOKEN: zod_1.z.string().optional(),
    TWILIO_PHONE_NUMBER: zod_1.z.string().optional(),
});
/**
 * Validate and parse environment variables
 * Throws descriptive error if validation fails
 */
const validateEnv = () => {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('❌ Environment variable validation failed:');
        result.error.issues.forEach((issue) => {
            console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
        });
        process.exit(1);
    }
    return result.data;
};
exports.validateEnv = validateEnv;
exports.env = (0, exports.validateEnv)();
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
function validateJwtSecret(key) {
    const value = process.env[key];
    const isWeak = !value || WEAK_SECRETS.has(value);
    if (!isWeak)
        return;
    if (process.env.NODE_ENV === 'production') {
        logger_1.default.error(`[FATAL] ${key} is a known weak default. Server startup aborted.`);
        process.exit(1);
    }
    else {
        logger_1.default.warn(`[WARN] ${key} is using a weak default value. Change it before deploying.`);
    }
}
validateJwtSecret('JWT_SECRET');
validateJwtSecret('JWT_REFRESH_SECRET');
//# sourceMappingURL=env.js.map