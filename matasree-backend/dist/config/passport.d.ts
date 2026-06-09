/**
 * Passport.js Configuration
 * Configures Google OAuth 2.0 and GitHub OAuth strategies
 * Handles user creation/linking for OAuth providers
 */
import passport from 'passport';
/**
 * Tracks which OAuth strategies have been successfully configured.
 * Routes should check this before calling passport.authenticate().
 */
export declare const configuredStrategies: Set<string>;
/**
 * Initialize all Passport strategies
 */
export declare const initializePassport: () => void;
export default passport;
//# sourceMappingURL=passport.d.ts.map