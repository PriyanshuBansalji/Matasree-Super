"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Auth Routes
 * Includes local auth, OAuth (Google/GitHub), token refresh, and OTP endpoints
 */
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const passport_2 = require("../config/passport");
const auth_1 = require("../middleware/auth");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// ============================================================
// LOCAL AUTH ROUTES
// ============================================================
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/logout', auth_1.verifyToken, authController_1.logout);
router.post('/logout-all', auth_1.verifyToken, authController_1.logoutAll);
// ============================================================
// TOKEN REFRESH (uses HTTP-only cookie)
// ============================================================
router.post('/refresh-token', authController_1.refreshToken);
// ============================================================
// OAUTH STATUS - frontend uses this to show/hide OAuth buttons
// ============================================================
router.get('/oauth-status', (_req, res) => {
    res.json({
        success: true,
        data: {
            google: passport_2.configuredStrategies.has('google'),
            github: passport_2.configuredStrategies.has('github'),
        },
    });
});
// ============================================================
// OAUTH - GOOGLE
// ============================================================
const googleNotConfigured = (_req, res) => res.status(503).json({
    success: false,
    message: 'Google OAuth is not configured on this server. Please use email/password login.',
    statusCode: 503,
});
router.get('/google', (req, res, next) => passport_2.configuredStrategies.has('google')
    ? passport_1.default.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next)
    : googleNotConfigured(req, res));
router.get('/google/callback', (req, res, next) => passport_2.configuredStrategies.has('google')
    ? passport_1.default.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:8000'}/login?error=google_auth_failed`,
    })(req, res, next)
    : googleNotConfigured(req, res), authController_1.oauthCallback);
// ============================================================
// OAUTH - GITHUB
// ============================================================
const githubNotConfigured = (_req, res) => res.status(503).json({
    success: false,
    message: 'GitHub OAuth is not configured on this server. Please use email/password login.',
    statusCode: 503,
});
router.get('/github', (req, res, next) => passport_2.configuredStrategies.has('github')
    ? passport_1.default.authenticate('github', { scope: ['user:email'], session: false })(req, res, next)
    : githubNotConfigured(req, res));
router.get('/github/callback', (req, res, next) => passport_2.configuredStrategies.has('github')
    ? passport_1.default.authenticate('github', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:8000'}/login?error=github_auth_failed`,
    })(req, res, next)
    : githubNotConfigured(req, res), authController_1.oauthCallback);
// ============================================================
// PROFILE
// ============================================================
router.get('/profile', auth_1.verifyToken, authController_1.getProfile);
router.put('/profile', auth_1.verifyToken, authController_1.updateProfile);
// ============================================================
// OTP ROUTES
// ============================================================
router.post('/send-email-otp', authController_1.sendEmailOtp);
router.post('/verify-email-otp', authController_1.verifyEmailOtp);
router.post('/resend-email-otp', authController_1.resendEmailOtp);
router.post('/send-mobile-otp', authController_1.sendMobileOtp);
router.post('/verify-mobile-otp', authController_1.verifyMobileOtp);
router.post('/resend-mobile-otp', authController_1.resendMobileOtp);
// ============================================================
// PASSWORD RESET
// ============================================================
router.post('/forgot-password', authController_1.sendPasswordResetOtp);
router.post('/verify-reset-otp', authController_1.verifyPasswordResetOtp);
router.post('/reset-password', authController_1.resetPassword);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map