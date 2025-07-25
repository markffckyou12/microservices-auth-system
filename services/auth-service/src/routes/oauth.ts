import { Router, Request, Response } from 'express';
import OAuthService from '../services/oauth';
import { Pool } from 'pg';

const router = Router();

export default function createOAuthRoutes(db: Pool) {
  const oauthService = OAuthService.getInstance();
  // Force OAuth service initialization
  console.log('🔄 Creating OAuth routes, initializing OAuth service...');
  console.log('✅ OAuth service initialized');

  // Debug endpoint to check OAuth service status
  router.get('/debug', (req: Request, res: Response) => {
    const status = oauthService.getStrategiesStatus();
    console.log('🔍 OAuth debug endpoint called, strategies status:', status);
    res.json({
      success: true,
      data: {
        strategies: status,
        environment: {
          googleClientId: !!process.env.GOOGLE_CLIENT_ID,
          googleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          githubClientId: !!process.env.GITHUB_CLIENT_ID,
          githubClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
          nodeEnv: process.env.NODE_ENV
        }
      }
    });
  });

  /**
   * @route GET /auth/google
   * @desc Initiate Google OAuth login
   */
  router.get('/google', (req: Request, res: Response, next: any) => {
    try {
      console.log('🔐 Initiating Google OAuth flow...');
      const authMiddleware = oauthService.authenticate('google');
      authMiddleware(req, res, next);
    } catch (error) {
      console.error('❌ Google OAuth initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'OAuth service not properly initialized',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * @route GET /auth/google/callback
   * @desc Handle Google OAuth callback
   */
  router.get('/google/callback', 
    (req: Request, res: Response, next: any) => {
      try {
        console.log('🔐 Processing Google OAuth callback...');
        const authMiddleware = oauthService.authenticateCallback('google');
        authMiddleware(req, res, next);
      } catch (error) {
        console.error('❌ Google OAuth callback error:', error);
        res.status(500).json({
          success: false,
          message: 'OAuth service not properly initialized',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    },
    async (req: Request, res: Response) => {
      try {
        const user = req.user as any;
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Google authentication failed'
          });
        }

        // Check if user exists in our database
        const existingUser = await db.query(
          'SELECT id, email FROM users WHERE email = $1',
          [user.email]
        );

        let userId: string;

        if (existingUser.rows.length === 0) {
          // Create new user
          const newUser = await db.query(
            `INSERT INTO users (email, display_name, avatar_url, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING id, email, display_name`,
            [user.email, user.displayName, user.avatar]
          );
          userId = newUser.rows[0].id;
        } else {
          userId = existingUser.rows[0].id;
        }

        // Store OAuth account info
        await db.query(
          `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, access_token, created_at)
           VALUES ($1, 'google', $2, $3, NOW())
           ON CONFLICT (user_id, provider) 
           DO UPDATE SET 
             provider_user_id = $2,
             access_token = $3,
             updated_at = NOW()`,
          [userId, user.providerId, req.query.access_token || null]
        );

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
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error during Google authentication'
        });
      }
    }
  );

  /**
   * @route GET /auth/github
   * @desc Initiate GitHub OAuth login
   */
  router.get('/github', (req: Request, res: Response, next: any) => {
    try {
      console.log('🔐 Initiating GitHub OAuth flow...');
      const authMiddleware = oauthService.authenticate('github');
      authMiddleware(req, res, next);
    } catch (error) {
      console.error('❌ GitHub OAuth initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'OAuth service not properly initialized',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * @route GET /auth/github/callback
   * @desc Handle GitHub OAuth callback
   */
  router.get('/github/callback',
    (req: Request, res: Response, next: any) => {
      try {
        console.log('🔐 Processing GitHub OAuth callback...');
        const authMiddleware = oauthService.authenticateCallback('github');
        authMiddleware(req, res, next);
      } catch (error) {
        console.error('❌ GitHub OAuth callback error:', error);
        res.status(500).json({
          success: false,
          message: 'OAuth service not properly initialized',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    },
    async (req: Request, res: Response) => {
      try {
        const user = req.user as any;
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'GitHub authentication failed'
          });
        }

        // Check if user exists in our database
        const existingUser = await db.query(
          'SELECT id, email FROM users WHERE email = $1',
          [user.email]
        );

        let userId: string;

        if (existingUser.rows.length === 0) {
          // Create new user
          const newUser = await db.query(
            `INSERT INTO users (email, display_name, avatar_url, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING id, email, display_name`,
            [user.email, user.displayName, user.avatar]
          );
          userId = newUser.rows[0].id;
        } else {
          userId = existingUser.rows[0].id;
        }

        // Store OAuth account info
        await db.query(
          `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, access_token, created_at)
           VALUES ($1, 'github', $2, $3, NOW())
           ON CONFLICT (user_id, provider) 
           DO UPDATE SET 
             provider_user_id = $2,
             access_token = $3,
             updated_at = NOW()`,
          [userId, user.providerId, req.query.access_token || null]
        );

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
      } catch (error) {
        console.error('GitHub OAuth callback error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error during GitHub authentication'
        });
      }
    }
  );

  /**
   * @route GET /auth/oauth/failure
   * @desc Handle OAuth authentication failure
   */
  router.get('/failure', (req: Request, res: Response) => {
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
  router.get('/providers', (req: Request, res: Response) => {
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