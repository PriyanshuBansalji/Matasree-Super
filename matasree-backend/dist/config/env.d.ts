/**
 * Environment Variable Validation & Configuration
 * Uses Zod to validate all required environment variables at startup
 * Prevents runtime errors from missing configuration
 */
import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    PORT: z.ZodDefault<z.ZodString>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        production: "production";
        test: "test";
        development: "development";
    }>>;
    MONGODB_URI: z.ZodString;
    FRONTEND_URL: z.ZodDefault<z.ZodString>;
    JWT_SECRET: z.ZodString;
    JWT_EXPIRE: z.ZodDefault<z.ZodString>;
    JWT_REFRESH_SECRET: z.ZodString;
    JWT_REFRESH_EXPIRE: z.ZodDefault<z.ZodString>;
    RATE_LIMIT_WINDOW_MS: z.ZodDefault<z.ZodString>;
    RATE_LIMIT_MAX_REQUESTS: z.ZodDefault<z.ZodString>;
    GOOGLE_CLIENT_ID: z.ZodOptional<z.ZodString>;
    GOOGLE_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    GOOGLE_CALLBACK_URL: z.ZodDefault<z.ZodString>;
    GITHUB_CLIENT_ID: z.ZodOptional<z.ZodString>;
    GITHUB_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    GITHUB_CALLBACK_URL: z.ZodDefault<z.ZodString>;
    CLOUDINARY_CLOUD_NAME: z.ZodOptional<z.ZodString>;
    CLOUDINARY_API_KEY: z.ZodOptional<z.ZodString>;
    CLOUDINARY_API_SECRET: z.ZodOptional<z.ZodString>;
    EMAIL_SERVICE: z.ZodDefault<z.ZodString>;
    EMAIL_USER: z.ZodOptional<z.ZodString>;
    EMAIL_PASSWORD: z.ZodOptional<z.ZodString>;
    ADMIN_EMAIL: z.ZodOptional<z.ZodString>;
    RAZORPAY_KEY_ID: z.ZodOptional<z.ZodString>;
    RAZORPAY_KEY_SECRET: z.ZodOptional<z.ZodString>;
    TWILIO_ACCOUNT_SID: z.ZodOptional<z.ZodString>;
    TWILIO_AUTH_TOKEN: z.ZodOptional<z.ZodString>;
    TWILIO_PHONE_NUMBER: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Validate and parse environment variables
 * Throws descriptive error if validation fails
 */
export declare const validateEnv: () => {
    PORT: string;
    NODE_ENV: "production" | "test" | "development";
    MONGODB_URI: string;
    FRONTEND_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRE: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRE: string;
    RATE_LIMIT_WINDOW_MS: string;
    RATE_LIMIT_MAX_REQUESTS: string;
    GOOGLE_CALLBACK_URL: string;
    GITHUB_CALLBACK_URL: string;
    EMAIL_SERVICE: string;
    GOOGLE_CLIENT_ID?: string | undefined;
    GOOGLE_CLIENT_SECRET?: string | undefined;
    GITHUB_CLIENT_ID?: string | undefined;
    GITHUB_CLIENT_SECRET?: string | undefined;
    CLOUDINARY_CLOUD_NAME?: string | undefined;
    CLOUDINARY_API_KEY?: string | undefined;
    CLOUDINARY_API_SECRET?: string | undefined;
    EMAIL_USER?: string | undefined;
    EMAIL_PASSWORD?: string | undefined;
    ADMIN_EMAIL?: string | undefined;
    RAZORPAY_KEY_ID?: string | undefined;
    RAZORPAY_KEY_SECRET?: string | undefined;
    TWILIO_ACCOUNT_SID?: string | undefined;
    TWILIO_AUTH_TOKEN?: string | undefined;
    TWILIO_PHONE_NUMBER?: string | undefined;
};
export type EnvConfig = z.infer<typeof envSchema>;
export declare const env: {
    PORT: string;
    NODE_ENV: "production" | "test" | "development";
    MONGODB_URI: string;
    FRONTEND_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRE: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRE: string;
    RATE_LIMIT_WINDOW_MS: string;
    RATE_LIMIT_MAX_REQUESTS: string;
    GOOGLE_CALLBACK_URL: string;
    GITHUB_CALLBACK_URL: string;
    EMAIL_SERVICE: string;
    GOOGLE_CLIENT_ID?: string | undefined;
    GOOGLE_CLIENT_SECRET?: string | undefined;
    GITHUB_CLIENT_ID?: string | undefined;
    GITHUB_CLIENT_SECRET?: string | undefined;
    CLOUDINARY_CLOUD_NAME?: string | undefined;
    CLOUDINARY_API_KEY?: string | undefined;
    CLOUDINARY_API_SECRET?: string | undefined;
    EMAIL_USER?: string | undefined;
    EMAIL_PASSWORD?: string | undefined;
    ADMIN_EMAIL?: string | undefined;
    RAZORPAY_KEY_ID?: string | undefined;
    RAZORPAY_KEY_SECRET?: string | undefined;
    TWILIO_ACCOUNT_SID?: string | undefined;
    TWILIO_AUTH_TOKEN?: string | undefined;
    TWILIO_PHONE_NUMBER?: string | undefined;
};
export {};
//# sourceMappingURL=env.d.ts.map