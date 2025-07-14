"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createOAuthRoutes;
const express_1 = require("express");
const oauth_1 = __importDefault(require("../services/oauth"));
const router = (0, express_1.Router)();
const oauthService = oauth_1.default.getInstance();
function createOAuthRoutes(db) {
    /**
     * @route GET /auth/google
     * @desc Initiate Google OAuth login
     */
    router.get('/google', oauthService.authenticate('google'));
    /**
     * @route GET /auth/google/callback
     * @desc Handle Google OAuth callback
     */
    router.get('/google/callback', oauthService.authenticateCallback('google'), async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Google authentication failed'
                });
            }
            // Check if user exists in our database
            const existingUser = await db.query('SELECT id, email FROM users WHERE email = $1', [user.email]);
            let userId;
            if (existingUser.rows.length === 0) {
                // Create new user
                const newUser = await db.query(`INSERT INTO users (email, display_name, avatar_url, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING id, email, display_name`, [user.email, user.displayName, user.avatar]);
                userId = newUser.rows[0].id;
            }
            else {
                userId = existingUser.rows[0].id;
            }
            // Store OAuth account info
            await db.query(`INSERT INTO oauth_accounts (user_id, provider, provider_user_id, access_token, created_at)
           VALUES ($1, 'google', $2, $3, NOW())
           ON CONFLICT (user_id, provider) 
           DO UPDATE SET 
             provider_user_id = $2,
             access_token = $3,
             updated_at = NOW()`, [userId, user.providerId, req.query.access_token || null]);
            // Generate JWT token
            const token = require('../utils/auth').signJwt({
                userId,
                email: user.email,
                type: 'access'
            });
            res.json({
                success: true,
                message: 'Google authentication successful',
                data: {
                    token,
                    user: {
                        id: userId,
                        email: user.email,
                        displayName: user.displayName,
                        avatar: user.avatar
                    }
                }
            });
        }
        catch (error) {
            console.error('Google OAuth callback error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during Google authentication'
            });
        }
    });
    /**
     * @route GET /auth/github
     * @desc Initiate GitHub OAuth login
     */
    router.get('/github', oauthService.authenticate('github'));
    /**
     * @route GET /auth/github/callback
     * @desc Handle GitHub OAuth callback
     */
    router.get('/github/callback', oauthService.authenticateCallback('github'), async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'GitHub authentication failed'
                });
            }
            // Check if user exists in our database
            const existingUser = await db.query('SELECT id, email FROM users WHERE email = $1', [user.email]);
            let userId;
            if (existingUser.rows.length === 0) {
                // Create new user
                const newUser = await db.query(`INSERT INTO users (email, display_name, avatar_url, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING id, email, display_name`, [user.email, user.displayName, user.avatar]);
                userId = newUser.rows[0].id;
            }
            else {
                userId = existingUser.rows[0].id;
            }
            // Store OAuth account info
            await db.query(`INSERT INTO oauth_accounts (user_id, provider, provider_user_id, access_token, created_at)
           VALUES ($1, 'github', $2, $3, NOW())
           ON CONFLICT (user_id, provider) 
           DO UPDATE SET 
             provider_user_id = $2,
             access_token = $3,
             updated_at = NOW()`, [userId, user.providerId, req.query.access_token || null]);
            // Generate JWT token
            const token = require('../utils/auth').signJwt({
                userId,
                email: user.email,
                type: 'access'
            });
            res.json({
                success: true,
                message: 'GitHub authentication successful',
                data: {
                    token,
                    user: {
                        id: userId,
                        email: user.email,
                        displayName: user.displayName,
                        avatar: user.avatar
                    }
                }
            });
        }
        catch (error) {
            console.error('GitHub OAuth callback error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during GitHub authentication'
            });
        }
    });
    /**
     * @route GET /auth/oauth/failure
     * @desc Handle OAuth authentication failure
     */
    router.get('/failure', (req, res) => {
        res.status(401).json({
            success: false,
            message: 'OAuth authentication failed',
            error: req.query.error || 'Unknown error'
        });
    });
    /**
     * @route GET /auth/oauth/providers
     * @desc Get available OAuth providers
     */
    router.get('/providers', (req, res) => {
        res.json({
            success: true,
            data: {
                providers: [
                    {
                        name: 'Google',
                        id: 'google',
                        url: '/auth/google',
                        icon: 'google'
                    },
                    {
                        name: 'GitHub',
                        id: 'github',
                        url: '/auth/github',
                        icon: 'github'
                    }
                ]
            }
        });
    });
    return router;
}
//# sourceMappingURL=oauth.js.map