/**
 * Passport.js Configuration
 * Configures Google OAuth 2.0 and GitHub OAuth strategies
 * Handles user creation/linking for OAuth providers
 */
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User';
import logger from './logger';

/**
 * Tracks which OAuth strategies have been successfully configured.
 * Routes should check this before calling passport.authenticate().
 */
export const configuredStrategies = new Set<string>();

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
    logger.warn('⚠️  Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    logger.warn('   Google login button will be disabled until credentials are set in .env');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email associated with Google account'), undefined);
          }

          // Check if user already exists with this email
          let user = await User.findOne({ email });

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
          user = await User.create({
            name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
            email,
            provider: 'google',
            providerId: profile.id,
            ...(googleAvatar && { avatar: googleAvatar }),
            isEmailVerified: true,
            role: 'customer',
          });

          logger.info(`New user registered via Google: ${email}`);
          return done(null, user);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );

  configuredStrategies.add('google');
  logger.info('✅ Google OAuth strategy registered');
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
    logger.warn('⚠️  GitHub OAuth not configured - missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
    logger.warn('   GitHub login button will be disabled until credentials are set in .env');
    return;
  }

  passport.use(
    new GitHubStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['user:email'],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // GitHub may not return email in profile, need to check emails
          const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;

          // Check if user already exists
          let user = await User.findOne({
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
          user = await User.create({
            name: profile.displayName || profile.username || 'GitHub User',
            email,
            provider: 'github',
            providerId: profile.id,
            ...(githubAvatar && { avatar: githubAvatar }),
            isEmailVerified: true,
            role: 'customer',
          });

          logger.info(`New user registered via GitHub: ${email}`);
          return done(null, user);
        } catch (error) {
          logger.error('GitHub OAuth error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );

  configuredStrategies.add('github');
  logger.info('✅ GitHub OAuth strategy registered');
};

/**
 * Passport serialization (for session-based, but we use JWT)
 */
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Initialize all Passport strategies
 */
export const initializePassport = () => {
  configureGoogleStrategy();
  configureGitHubStrategy();
  logger.info('✅ Passport strategies initialized');
};

export default passport;
