import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { createLogger } from './config/logger';
import { setupDatabase, getDatabase } from './config/database';
import { setupRedis, getRedis } from './config/redis';
import { setupMiddleware } from './middleware';
import { setupRoutes } from './routes';
import { setupErrorHandling } from './middleware/errorHandler';
import { HEALTH_CHECK } from '@auth-system/shared';

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const logger = createLogger();
const port = process.env.AUTH_SERVICE_PORT || process.env.PORT || 3001;

// Initialize services
async function initializeServices() {
  try {
    // Setup database connection
    await setupDatabase();
    const db = getDatabase();
    logger.info('Database connection established');

    // Setup Redis connection
    await setupRedis();
    const redis = getRedis();
    logger.info('Redis connection established');

    // Setup middleware
    setupMiddleware(app);
    logger.info('Middleware setup complete');

    // Setup routes with database and Redis connections
    setupRoutes(app, db, redis);
    logger.info('Routes setup complete');

    // Setup error handling
    setupErrorHandling(app);
    logger.info('Error handling setup complete');

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // Start server
    app.listen(port, () => {
      logger.info(`Auth Service started on port ${port}`);
      logger.info(`Health check available at http://localhost:${port}/health`);
    });

  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize the application
initializeServices().catch((error) => {
  logger.error('Failed to start Auth Service:', error);
  process.exit(1);
});

export default app; 