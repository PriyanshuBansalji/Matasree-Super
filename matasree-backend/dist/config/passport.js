"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePassport = exports.configuredStrategies = void 0;
/**
 * Passport.js Configuration
 * Configures Google OAuth 2.0 and GitHub OAuth strategies
 * Handles user creation/linking for OAuth providers
 */
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_github2_1 = require("passport-github2");
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Tracks which OAuth strategies have been successfully configured.
 * Routes should check this before calling passport.authenticate().
 */
exports.configuredStrategies = new Set();
/**
 * Configure Google OAuth 2.0 Strategy
 */
const configureGoogleStrategy = () => {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    // Must be an absolute URL for Google OAuth - relative paths will fail
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${backendUrl}/api/auth/google/callback`;
    if (!clientID || !clientSecret) {
        logger_1.default.warn('⚠️  Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
        logger_1.default.warn('   Google login button will be disabled until credentials are set in .env');
        return;
    }
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID,
        clientSecret,
        callbackURL,
        scope: ['profile', 'email'],
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
                return done(new Error('No email associated with Google account'), undefined);
            }
            // Check if user already exists with this email
            let user = await User_1.default.findOne({ email });
            if (user) {
                // Link Google account if not already linked
                if (user.provider === 'local') {
                    user.provider = 'google';
                    user.providerId = profile.id;
                    // Only overwrite avatar if Google provides one
                    if (profile.photos?.[0]?.value) {
                        user.avatar = profile.photos[0].value;
                    }
                    user.isEmailVerified = true;
                    await user.save();
                }
                return done(null, user);
            }
            // Create new user from Google profile
            const googleAvatar = profile.photos?.[0]?.value;
            user = await User_1.default.create({
                name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
                email,
                provider: 'google',
                providerId: profile.id,
                ...(googleAvatar && { avatar: googleAvatar }),
                isEmailVerified: true,
                role: 'customer',
            });
            logger_1.default.info(`New user registered via Google: ${email}`);
            return done(null, user);
        }
        catch (error) {
            logger_1.default.error('Google OAuth error:', error);
            return done(error, undefined);
        }
    }));
    exports.configuredStrategies.add('google');
    logger_1.default.info('✅ Google OAuth strategy registered');
};
/**
 * Configure GitHub OAuth Strategy
 */
const configureGitHubStrategy = () => {
    const clientID = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    // Must be an absolute URL for GitHub OAuth
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
    const callbackURL = process.env.GITHUB_CALLBACK_URL || `${backendUrl}/api/auth/github/callback`;
    if (!clientID || !clientSecret) {
        logger_1.default.warn('⚠️  GitHub OAuth not configured - missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
        logger_1.default.warn('   GitHub login button will be disabled until credentials are set in .env');
        return;
    }
    passport_1.default.use(new passport_github2_1.Strategy({
        clientID,
        clientSecret,
        callbackURL,
        scope: ['user:email'],
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // GitHub may not return email in profile, need to check emails
            const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
            // Check if user already exists
            let user = await User_1.default.findOne({
                $or: [
                    { email },
                    { provider: 'github', providerId: profile.id },
                ],
            });
            if (user) {
                // Update provider info if needed
                if (!user.providerId && user.provider === 'local') {
                    user.provider = 'github';
                    user.providerId = profile.id;
                    // Only overwrite avatar if GitHub provides one
                    if (profile.photos?.[0]?.value) {
                        user.avatar = profile.photos[0].value;
                    }
                    await user.save();
                }
                return done(null, user);
            }
            // Create new user
            const githubAvatar = profile.photos?.[0]?.value;
            user = await User_1.default.create({
                name: profile.displayName || profile.username || 'GitHub User',
                email,
                provider: 'github',
                providerId: profile.id,
                ...(githubAvatar && { avatar: githubAvatar }),
                isEmailVerified: true,
                role: 'customer',
            });
            logger_1.default.info(`New user registered via GitHub: ${email}`);
            return done(null, user);
        }
        catch (error) {
            logger_1.default.error('GitHub OAuth error:', error);
            return done(error, undefined);
        }
    }));
    exports.configuredStrategies.add('github');
    logger_1.default.info('✅ GitHub OAuth strategy registered');
};
/**
 * Passport serialization (for session-based, but we use JWT)
 */
passport_1.default.serializeUser((user, done) => {
    done(null, user._id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await User_1.default.findById(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
/**
 * Initialize all Passport strategies
 */
const initializePassport = () => {
    configureGoogleStrategy();
    configureGitHubStrategy();
    logger_1.default.info('✅ Passport strategies initialized');
};
exports.initializePassport = initializePassport;
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map