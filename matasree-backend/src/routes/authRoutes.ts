import { Router } from 'express';
import * as authController from '../controllers/authController';
import { verifyToken, verifyCustomer } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// OTP routes
router.post('/send-email-otp', authController.sendEmailOtp);
router.post('/verify-email-otp', authController.verifyEmailOtp);
router.post('/resend-email-otp', authController.resendEmailOtp);
router.post('/send-mobile-otp', authController.sendMobileOtp);
router.post('/verify-mobile-otp', authController.verifyMobileOtp);
router.post('/resend-mobile-otp', authController.resendMobileOtp);

// Protected routes
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.post('/logout', verifyToken, authController.logout);

export default router;
