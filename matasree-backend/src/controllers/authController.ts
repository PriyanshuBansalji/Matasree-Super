import { Response } from 'express';
import User from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { ApiResponse, ApiError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendOTPEmail, sendOTPSMS } from '../utils/email';
import Joi from 'joi';

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().required().trim(),
  email: Joi.string().email().required().lowercase(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase(),
  password: Joi.string().required(),
});

/**
 * Register a new user
 */
export const register = async (req: any, res: Response) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { name, email, password, phone } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(new ApiResponse(false, 'Email already registered', null, 400));
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'customer',
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.email, user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    res.status(201).json(
      new ApiResponse(true, 'Registration successful', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin || false,
        },
        accessToken,
        refreshToken,
      })
    );
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Registration failed', null, 500));
  }
};

/**
 * Login user
 */
export const login = async (req: any, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { email, password } = value;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json(new ApiResponse(false, 'Invalid email or password', null, 401));
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(new ApiResponse(false, 'Invalid email or password', null, 401));
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.email, user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    res.status(200).json(
      new ApiResponse(true, 'Login successful', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin || false,
        },
        accessToken,
        refreshToken,
      })
    );
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Login failed', null, 500));
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(false, 'User not found', null, 404));
    }

    res.status(200).json(
      new ApiResponse(true, 'Profile fetched', {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      })
    );
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch profile', null, 500));
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user?.userId,
      { name, phone },
      { new: true }
    );

    if (!user) {
      return res.status(404).json(new ApiResponse(false, 'User not found', null, 404));
    }

    res.status(200).json(
      new ApiResponse(true, 'Profile updated', {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      })
    );
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to update profile', null, 500));
  }
};

/**
 * Logout user
 */
export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.status(200).json(new ApiResponse(true, 'Logout successful'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Logout failed', null, 500));
  }
};

// OTP Storage (In production, use Redis or database)
const otpStore: Record<string, { otp: string; expiresAt: number; attempts: number }> = {};
const emailOtpStore: Record<string, { otp: string; expiresAt: number; attempts: number }> = {};

/**
 * Generate a random 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send email OTP
 */
export const sendEmailOtp = async (req: any, res: Response) => {
  try {
    const { email } = req.body;

    console.log('Send Email OTP Request:', { email });

    if (!email) {
      return res.status(400).json(new ApiResponse(false, 'Email is required', null, 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(new ApiResponse(false, 'Email already registered', null, 400));
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    emailOtpStore[email] = { otp, expiresAt, attempts: 0 };

    console.log(`Email OTP for ${email}: ${otp}`);

    // Send email with OTP
    const emailSent = await sendOTPEmail(email, otp);
    
    if (!emailSent) {
      delete emailOtpStore[email];
      return res.status(500).json(new ApiResponse(false, 'Failed to send OTP email. Please try again.', null, 500));
    }

    res.status(200).json(
      new ApiResponse(true, 'OTP sent to email', {
        email,
        // For development only - remove in production
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      })
    );
  } catch (error: any) {
    console.error('Error sending email OTP:', error);
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to send email OTP', null, 500));
  }
};

/**
 * Verify email OTP
 */
export const verifyEmailOtp = async (req: any, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json(new ApiResponse(false, 'Email and OTP are required', null, 400));
    }

    const storedOtpData = emailOtpStore[email];

    if (!storedOtpData) {
      return res.status(400).json(new ApiResponse(false, 'OTP not found or expired', null, 400));
    }

    if (storedOtpData.expiresAt < Date.now()) {
      delete emailOtpStore[email];
      return res.status(400).json(new ApiResponse(false, 'OTP has expired', null, 400));
    }

    if (storedOtpData.attempts >= 3) {
      delete emailOtpStore[email];
      return res.status(400).json(new ApiResponse(false, 'Too many attempts. Request a new OTP', null, 400));
    }

    if (storedOtpData.otp !== otp) {
      storedOtpData.attempts += 1;
      return res.status(400).json(new ApiResponse(false, 'Invalid OTP', null, 400));
    }

    // OTP verified - mark as verified
    delete emailOtpStore[email];

    res.status(200).json(new ApiResponse(true, 'Email OTP verified successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to verify email OTP', null, 500));
  }
};

/**
 * Resend email OTP
 */
export const resendEmailOtp = async (req: any, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(new ApiResponse(false, 'Email is required', null, 400));
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    emailOtpStore[email] = { otp, expiresAt, attempts: 0 };

    console.log(`Email OTP (resend) for ${email}: ${otp}`);

    // Send email with OTP
    const emailSent = await sendOTPEmail(email, otp);
    
    if (!emailSent) {
      delete emailOtpStore[email];
      return res.status(500).json(new ApiResponse(false, 'Failed to resend OTP email. Please try again.', null, 500));
    }

    res.status(200).json(
      new ApiResponse(true, 'OTP resent to email', {
        email,
        // For development only - remove in production
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      })
    );
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to resend email OTP', null, 500));
  }
};

/**
 * Send mobile OTP
 */
export const sendMobileOtp = async (req: any, res: Response) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json(new ApiResponse(false, 'Mobile number is required', null, 400));
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore[mobile] = { otp, expiresAt, attempts: 0 };

    console.log(`Mobile OTP for ${mobile}: ${otp}`);

    // Send SMS with OTP
    const smsSent = await sendOTPSMS(mobile, otp);
    
    if (!smsSent) {
      delete otpStore[mobile];
      return res.status(500).json(new ApiResponse(false, 'Failed to send OTP SMS. Please try again.', null, 500));
    }

    res.status(200).json(
      new ApiResponse(true, 'OTP sent to mobile', {
        mobile,
        // For development only - remove in production
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      })
    );
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to send mobile OTP', null, 500));
  }
};

/**
 * Verify mobile OTP
 */
export const verifyMobileOtp = async (req: any, res: Response) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json(new ApiResponse(false, 'Mobile number and OTP are required', null, 400));
    }

    const storedOtpData = otpStore[mobile];

    if (!storedOtpData) {
      return res.status(400).json(new ApiResponse(false, 'OTP not found or expired', null, 400));
    }

    if (storedOtpData.expiresAt < Date.now()) {
      delete otpStore[mobile];
      return res.status(400).json(new ApiResponse(false, 'OTP has expired', null, 400));
    }

    if (storedOtpData.attempts >= 3) {
      delete otpStore[mobile];
      return res.status(400).json(new ApiResponse(false, 'Too many attempts. Request a new OTP', null, 400));
    }

    if (storedOtpData.otp !== otp) {
      storedOtpData.attempts += 1;
      return res.status(400).json(new ApiResponse(false, 'Invalid OTP', null, 400));
    }

    // OTP verified - mark as verified
    delete otpStore[mobile];

    res.status(200).json(new ApiResponse(true, 'Mobile OTP verified successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to verify mobile OTP', null, 500));
  }
};

/**
 * Resend mobile OTP
 */
export const resendMobileOtp = async (req: any, res: Response) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json(new ApiResponse(false, 'Mobile number is required', null, 400));
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore[mobile] = { otp, expiresAt, attempts: 0 };

    console.log(`Mobile OTP (resend) for ${mobile}: ${otp}`);

    // Send SMS with OTP
    const smsSent = await sendOTPSMS(mobile, otp);
    
    if (!smsSent) {
      delete otpStore[mobile];
      return res.status(500).json(new ApiResponse(false, 'Failed to resend OTP SMS. Please try again.', null, 500));
    }

    res.status(200).json(
      new ApiResponse(true, 'OTP resent to mobile', {
        mobile,
        // For development only - remove in production
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      })
    );
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to resend mobile OTP', null, 500));
  }
};
