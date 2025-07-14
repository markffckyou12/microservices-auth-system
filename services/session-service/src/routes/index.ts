import { Express } from 'express';
import { RedisClientType } from 'redis';
import createSessionRoutes from './session';

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

  // Session Management Routes
  app.use('/api/v1/sessions', createSessionRoutes(redis));
}; 