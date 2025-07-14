import { Express, Request, Response } from 'express';
import { register, login } from '../controllers/authController';
import { body } from 'express-validator';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';

// Import Phase 2 routes
import createOAuthRoutes from './oauth';
import createMFARoutes from './mfa';

export const setupRoutes = (app: Express, db: Pool, redis: RedisClientType) => {
  // Health check route
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      service: 'auth-service',
      timestamp: new Date().toISOString()
    });
  });

  // Basic Auth endpoints
  app.post(
    '/api/v1/auth/register',
    [
      body('email').isEmail(),
      body('username').isLength({ min: 3, max: 30 }),
      body('password').isLength({ min: 8 }),
      body('firstName').notEmpty(),
      body('lastName').notEmpty()
    ],
    register
  );

  app.post(
    '/api/v1/auth/login',
    [
      body('email').isEmail(),
      body('password').isLength({ min: 8 })
    ],
    login
  );

  // API status route
  app.get('/api/v1/auth/status', (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Auth Service is running',
      version: '1.0.0'
    });
  });

  // Phase 2: OAuth Routes
  app.use('/api/v1/auth/oauth', createOAuthRoutes(db));

  // Phase 2: MFA Routes
  app.use('/api/v1/auth/mfa', createMFARoutes(db));
}; 