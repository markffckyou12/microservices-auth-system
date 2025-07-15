import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { setupRoutes } from './routes';
import { AuthorizationMiddleware } from './middleware/authorization';
import { RBACService } from './services/rbac';
import { AuditServiceImpl } from './services/audit';
import { PasswordServiceImpl } from './services/password';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

// Database connection
const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'auth_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize services
const rbacService = new RBACService(db);
const auditService = new AuditServiceImpl(db);
const passwordService = new PasswordServiceImpl(db);
const authMiddleware = new AuthorizationMiddleware(rbacService, auditService);

// Setup middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    features: {
      rbac: true,
      audit: true,
      authorization: true,
      password: true
    }
  });
});

// Setup routes
const apiRouter = setupRoutes(db);
app.use('/api/v1', apiRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await db.end();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
app.listen(port, () => {
  console.log(`User Service started on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
  console.log(`API available at http://localhost:${port}/api/v1`);
  console.log('Phase 3 Features:');
  console.log('  ✅ RBAC System');
  console.log('  ✅ Audit Logging');
  console.log('  ✅ Authorization Middleware');
  console.log('  ✅ Password Management');
});

export default app;