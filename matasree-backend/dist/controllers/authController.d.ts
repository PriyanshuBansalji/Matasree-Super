/**
 * Auth Controller - Production Ready
 * Handles local auth (email/password), OAuth callbacks, token refresh, and logout
 * Uses AuthService for token management and HTTP-only cookies
 */
import { Response, RequestHandler } from 'express';
/**
 * Register a new user with email/password
 */
export declare const register: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Login user with email/password
 */
export declare const login: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Refresh access token using refresh token from HTTP-only cookie
 * Implements token rotation for security
 */
export declare const refreshToken: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Handle OAuth callback (used for both Google and GitHub)
 * Stores token in memory and redirects to frontend without token in URL
 * Frontend fetches token from GET /api/auth/token endpoint
 */
export declare const oauthCallback: RequestHandler;
/**
 * Get OAuth access token (called by frontend after OAuth redirect)
 * Returns token exactly once, then destroys it
 * Requires valid httpOnly refresh cookie from OAuth flow
 */
export declare const getOAuthToken: RequestHandler;
/**
 * Logout user - revoke refresh token and clear cookie
 */
export declare const logout: RequestHandler;
/**
 * Logout from all devices - revoke ALL refresh tokens
 */
export declare const logoutAll: RequestHandler;
/**
 * Get current user profile
 */
export declare const getProfile: RequestHandler;
/**
 * Update user profile
 */
export declare const updateProfile: RequestHandler;
/** Send email OTP */
export declare const sendEmailOtp: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/** Verify email OTP */
export declare const verifyEmailOtp: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/** Resend email OTP */
export declare const resendEmailOtp: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/** Send mobile OTP */
export declare const sendMobileOtp: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/** Verify mobile OTP */
export declare const verifyMobileOtp: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/** Resend mobile OTP */
export declare const resendMobileOtp: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/** Send password reset OTP */
export declare const sendPasswordResetOtp: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/** Verify password reset OTP */
export declare const verifyPasswordResetOtp: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/** Reset password */
export declare const resetPassword: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=authController.d.ts.map