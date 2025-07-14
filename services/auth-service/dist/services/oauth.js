"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthService = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_github2_1 = require("passport-github2");
class OAuthService {
    constructor() {
        this.initializeStrategies();
    }
    static getInstance() {
        if (!OAuthService.instance) {
            OAuthService.instance = new OAuthService();
        }
        return OAuthService.instance;
    }
    initializeStrategies() {
        // Google OAuth Strategy
        passport_1.default.use(new passport_google_oauth20_1.Strategy({
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
            scope: ['profile', 'email'],
            passReqToCallback: true
        }, this.handleGoogleCallback.bind(this)));
        // GitHub OAuth Strategy
        passport_1.default.use(new passport_github2_1.Strategy({
            clientID: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
            callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/github/callback',
            scope: ['user:email']
        }, this.handleGitHubCallback.bind(this)));
    }
    // Update Google callback signature to match StrategyOptionsWithRequest
    async handleGoogleCallback(req, accessToken, refreshToken, params, profile, done) {
        try {
            const user = {
                id: profile.id,
                email: profile.emails?.[0]?.value || '',
                displayName: profile.displayName,
                avatar: profile.photos?.[0]?.value,
                provider: 'google',
                providerId: profile.id
            };
            done(null, user);
        }
        catch (error) {
            done(error);
        }
    }
    async handleGitHubCallback(accessToken, refreshToken, profile, done) {
        try {
            const user = {
                id: profile.id,
                email: profile.emails?.[0]?.value || '',
                displayName: profile.displayName,
                avatar: profile.photos?.[0]?.value,
                provider: 'github',
                providerId: profile.id
            };
            done(null, user);
        }
        catch (error) {
            done(error);
        }
    }
    getPassport() {
        return passport_1.default;
    }
    authenticate(provider) {
        return passport_1.default.authenticate(provider, { session: false });
    }
    authenticateCallback(provider) {
        return passport_1.default.authenticate(provider, {
            session: false,
            failureRedirect: '/auth/failure'
        });
    }
}
exports.OAuthService = OAuthService;
exports.default = OAuthService;
//# sourceMappingURL=oauth.js.map