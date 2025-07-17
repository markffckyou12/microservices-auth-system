import { Express } from 'express';
import { RedisClientType } from 'redis';
import createSessionRoutes from './session';
import jwt from 'jsonwebtoken';

// JWT Authentication Middleware
const authenticateJwt = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production') as any;
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const setupRoutes = (app: Express, redis: RedisClientType) => {
  // Health check route
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'session-service',
      timestamp: new Date().toISOString()
    });
  });

  // API status route
  app.get('/api/v1/sessions/status', (req, res) => {
    res.status(200).json({
      message: 'Session Service is running',
      version: '1.0.0'
    });
  });

  // Session Management Routes with JWT authentication
  app.use('/api/v1/sessions', authenticateJwt, createSessionRoutes(redis));
}; 