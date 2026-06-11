/**
 * Auth Routes
 * Includes local auth, OAuth (Google/GitHub), token refresh, and OTP endpoints
 */
import { Router } from 'express';
import passport from 'passport';
import { configuredStrategies } from '../config/passport';
import { verifyToken } from '../middleware/auth';
import {
  register,
  login,
  logout,
  logoutAll,
  getProfile,
  updateProfile,
  refreshToken,
  oauthCallback,
  getOAuthToken,
  sendEmailOtp,
  verifyEmailOtp,
  resendEmailOtp,
  sendMobileOtp,
  verifyMobileOtp,
  resendMobileOtp,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
} from '../controllers/authController';

const router = Router();

// ============================================================
// LOCAL AUTH ROUTES
// ============================================================
router.post('/register', register);
router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.post('/logout-all', verifyToken, logoutAll);

// ============================================================
// TOKEN REFRESH (uses HTTP-only cookie)
// ============================================================
router.post('/refresh-token', refreshToken);

// ============================================================
// OAUTH STATUS - frontend uses this to show/hide OAuth buttons
// ============================================================
router.get('/oauth-status', (_req, res) => {
  res.json({
    success: true,
    data: {
      google: configuredStrategies.has('google'),
      github: configuredStrategies.has('github'),
    },
  });
});

// ============================================================
// OAUTH TOKEN RETRIEVAL (secure, one-time, cookie-authenticated)
// ============================================================
// Called by frontend after OAuth callback; returns access token exactly once
router.get('/token', verifyToken, getOAuthToken);

// ============================================================
// OAUTH - GOOGLE
// ============================================================
const googleNotConfigured = (_req: any, res: any) =>
  res.status(503).json({
    success: false,
    message: 'Google OAuth is not configured on this server. Please use email/password login.',
    statusCode: 503,
  });

router.get(
  '/google',
  (req, res, next) =>
    configuredStrategies.has('google')
      ? passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next)
      : googleNotConfigured(req, res)
);

router.get(
  '/google/callback',
  (req, res, next) =>
    configuredStrategies.has('google')
      ? passport.authenticate('google', {
          session: false,
          failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:8000'}/login?error=google_auth_failed`,
        })(req, res, next)
      : googleNotConfigured(req, res),
  oauthCallback
);

// ============================================================
// OAUTH - GITHUB
// ============================================================
const githubNotConfigured = (_req: any, res: any) =>
  res.status(503).json({
    success: false,
    message: 'GitHub OAuth is not configured on this server. Please use email/password login.',
    statusCode: 503,
  });

router.get(
  '/github',
  (req, res, next) =>
    configuredStrategies.has('github')
      ? passport.authenticate('github', { scope: ['user:email'], session: false })(req, res, next)
      : githubNotConfigured(req, res)
);

router.get(
  '/github/callback',
  (req, res, next) =>
    configuredStrategies.has('github')
      ? passport.authenticate('github', {
          session: false,
          failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:8000'}/login?error=github_auth_failed`,
        })(req, res, next)
      : githubNotConfigured(req, res),
  oauthCallback
);

// ============================================================
// PROFILE
// ============================================================
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

// ============================================================
// OTP ROUTES
// ============================================================
router.post('/send-email-otp', sendEmailOtp);
router.post('/verify-email-otp', verifyEmailOtp);
router.post('/resend-email-otp', resendEmailOtp);
router.post('/send-mobile-otp', sendMobileOtp);
router.post('/verify-mobile-otp', verifyMobileOtp);
router.post('/resend-mobile-otp', resendMobileOtp);

// ============================================================
// PASSWORD RESET
// ============================================================
router.post('/forgot-password', sendPasswordResetOtp);
router.post('/verify-reset-otp', verifyPasswordResetOtp);
router.post('/reset-password', resetPassword);

export default router;
