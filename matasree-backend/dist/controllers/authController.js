"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendMobileOtp = exports.verifyMobileOtp = exports.sendMobileOtp = exports.resendEmailOtp = exports.verifyEmailOtp = exports.sendEmailOtp = exports.logout = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const email_1 = require("../utils/email");
const joi_1 = __importDefault(require("joi"));
// Validation schemas
const registerSchema = joi_1.default.object({
    name: joi_1.default.string().required().trim(),
    email: joi_1.default.string().email().required().lowercase(),
    password: joi_1.default.string().min(6).required(),
    phone: joi_1.default.string().optional(),
});
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().lowercase(),
    password: joi_1.default.string().required(),
});
/**
 * Register a new user
 */
const register = async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { name, email, password, phone } = value;
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Email already registered', null, 400));
        }
        // Hash password
        const hashedPassword = await (0, password_1.hashPassword)(password);
        // Create user
        const user = await User_1.default.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role: 'customer',
        });
        // Generate tokens
        const accessToken = (0, jwt_1.generateAccessToken)(user._id.toString(), user.email, user.role);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user._id.toString());
        res.status(201).json(new response_1.ApiResponse(true, 'Registration successful', {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isAdmin: user.isAdmin || false,
            },
            accessToken,
            refreshToken,
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Registration failed', null, 500));
    }
};
exports.register = register;
/**
 * Login user
 */
const login = async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { email, password } = value;
        // Find user
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json(new response_1.ApiResponse(false, 'Invalid email or password', null, 401));
        }
        // Compare password
        const isPasswordValid = await (0, password_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json(new response_1.ApiResponse(false, 'Invalid email or password', null, 401));
        }
        // Generate tokens
        const accessToken = (0, jwt_1.generateAccessToken)(user._id.toString(), user.email, user.role);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user._id.toString());
        res.status(200).json(new response_1.ApiResponse(true, 'Login successful', {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isAdmin: user.isAdmin || false,
            },
            accessToken,
            refreshToken,
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Login failed', null, 500));
    }
};
exports.login = login;
/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user?.userId);
        if (!user) {
            return res.status(404).json(new response_1.ApiResponse(false, 'User not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Profile fetched', {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch profile', null, 500));
    }
};
exports.getProfile = getProfile;
/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const user = await User_1.default.findByIdAndUpdate(req.user?.userId, { name, phone }, { new: true });
        if (!user) {
            return res.status(404).json(new response_1.ApiResponse(false, 'User not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Profile updated', {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to update profile', null, 500));
    }
};
exports.updateProfile = updateProfile;
/**
 * Logout user
 */
const logout = async (req, res) => {
    try {
        res.status(200).json(new response_1.ApiResponse(true, 'Logout successful'));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Logout failed', null, 500));
    }
};
exports.logout = logout;
// OTP Storage (In production, use Redis or database)
const otpStore = {};
const emailOtpStore = {};
/**
 * Generate a random 6-digit OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/**
 * Send email OTP
 */
const sendEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Send Email OTP Request:', { email });
        if (!email) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Email is required', null, 400));
        }
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Email already registered', null, 400));
        }
        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        emailOtpStore[email] = { otp, expiresAt, attempts: 0 };
        console.log(`Email OTP for ${email}: ${otp}`);
        // Send email with OTP
        const emailSent = await (0, email_1.sendOTPEmail)(email, otp);
        if (!emailSent) {
            delete emailOtpStore[email];
            return res.status(500).json(new response_1.ApiResponse(false, 'Failed to send OTP email. Please try again.', null, 500));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'OTP sent to email', {
            email,
            // For development only - remove in production
            otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        }));
    }
    catch (error) {
        console.error('Error sending email OTP:', error);
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to send email OTP', null, 500));
    }
};
exports.sendEmailOtp = sendEmailOtp;
/**
 * Verify email OTP
 */
const verifyEmailOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Email and OTP are required', null, 400));
        }
        const storedOtpData = emailOtpStore[email];
        if (!storedOtpData) {
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP not found or expired', null, 400));
        }
        if (storedOtpData.expiresAt < Date.now()) {
            delete emailOtpStore[email];
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP has expired', null, 400));
        }
        if (storedOtpData.attempts >= 3) {
            delete emailOtpStore[email];
            return res.status(400).json(new response_1.ApiResponse(false, 'Too many attempts. Request a new OTP', null, 400));
        }
        if (storedOtpData.otp !== otp) {
            storedOtpData.attempts += 1;
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid OTP', null, 400));
        }
        // OTP verified - mark as verified
        delete emailOtpStore[email];
        res.status(200).json(new response_1.ApiResponse(true, 'Email OTP verified successfully'));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to verify email OTP', null, 500));
    }
};
exports.verifyEmailOtp = verifyEmailOtp;
/**
 * Resend email OTP
 */
const resendEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Email is required', null, 400));
        }
        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        emailOtpStore[email] = { otp, expiresAt, attempts: 0 };
        console.log(`Email OTP (resend) for ${email}: ${otp}`);
        // Send email with OTP
        const emailSent = await (0, email_1.sendOTPEmail)(email, otp);
        if (!emailSent) {
            delete emailOtpStore[email];
            return res.status(500).json(new response_1.ApiResponse(false, 'Failed to resend OTP email. Please try again.', null, 500));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'OTP resent to email', {
            email,
            // For development only - remove in production
            otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to resend email OTP', null, 500));
    }
};
exports.resendEmailOtp = resendEmailOtp;
/**
 * Send mobile OTP
 */
const sendMobileOtp = async (req, res) => {
    try {
        const { mobile } = req.body;
        if (!mobile) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Mobile number is required', null, 400));
        }
        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        otpStore[mobile] = { otp, expiresAt, attempts: 0 };
        console.log(`Mobile OTP for ${mobile}: ${otp}`);
        // Send SMS with OTP
        const smsSent = await (0, email_1.sendOTPSMS)(mobile, otp);
        if (!smsSent) {
            delete otpStore[mobile];
            return res.status(500).json(new response_1.ApiResponse(false, 'Failed to send OTP SMS. Please try again.', null, 500));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'OTP sent to mobile', {
            mobile,
            // For development only - remove in production
            otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to send mobile OTP', null, 500));
    }
};
exports.sendMobileOtp = sendMobileOtp;
/**
 * Verify mobile OTP
 */
const verifyMobileOtp = async (req, res) => {
    try {
        const { mobile, otp } = req.body;
        if (!mobile || !otp) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Mobile number and OTP are required', null, 400));
        }
        const storedOtpData = otpStore[mobile];
        if (!storedOtpData) {
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP not found or expired', null, 400));
        }
        if (storedOtpData.expiresAt < Date.now()) {
            delete otpStore[mobile];
            return res.status(400).json(new response_1.ApiResponse(false, 'OTP has expired', null, 400));
        }
        if (storedOtpData.attempts >= 3) {
            delete otpStore[mobile];
            return res.status(400).json(new response_1.ApiResponse(false, 'Too many attempts. Request a new OTP', null, 400));
        }
        if (storedOtpData.otp !== otp) {
            storedOtpData.attempts += 1;
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid OTP', null, 400));
        }
        // OTP verified - mark as verified
        delete otpStore[mobile];
        res.status(200).json(new response_1.ApiResponse(true, 'Mobile OTP verified successfully'));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to verify mobile OTP', null, 500));
    }
};
exports.verifyMobileOtp = verifyMobileOtp;
/**
 * Resend mobile OTP
 */
const resendMobileOtp = async (req, res) => {
    try {
        const { mobile } = req.body;
        if (!mobile) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Mobile number is required', null, 400));
        }
        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        otpStore[mobile] = { otp, expiresAt, attempts: 0 };
        console.log(`Mobile OTP (resend) for ${mobile}: ${otp}`);
        // Send SMS with OTP
        const smsSent = await (0, email_1.sendOTPSMS)(mobile, otp);
        if (!smsSent) {
            delete otpStore[mobile];
            return res.status(500).json(new response_1.ApiResponse(false, 'Failed to resend OTP SMS. Please try again.', null, 500));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'OTP resent to mobile', {
            mobile,
            // For development only - remove in production
            otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to resend mobile OTP', null, 500));
    }
};
exports.resendMobileOtp = resendMobileOtp;
//# sourceMappingURL=authController.js.map