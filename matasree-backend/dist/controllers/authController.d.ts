import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
/**
 * Register a new user
 */
export declare const register: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Login user
 */
export declare const login: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get current user profile
 */
export declare const getProfile: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update user profile
 */
export declare const updateProfile: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Logout user
 */
export declare const logout: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Send email OTP
 */
export declare const sendEmailOtp: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Verify email OTP
 */
export declare const verifyEmailOtp: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Resend email OTP
 */
export declare const resendEmailOtp: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Send mobile OTP
 */
export declare const sendMobileOtp: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Verify mobile OTP
 */
export declare const verifyMobileOtp: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Resend mobile OTP
 */
export declare const resendMobileOtp: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=authController.d.ts.map