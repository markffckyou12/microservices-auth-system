import { Express } from 'express';
import { Pool } from 'pg';
import createUserRoutes from './user';
import createPasswordRoutes from './password';
import { createRBACRouter } from './rbac';
import { createAuditRouter } from './audit';
import { RBACServiceImpl } from '../services/rbac';
import { AuditServiceImpl } from '../services/audit';
import { AuthorizationMiddleware } from '../middleware/authorization';

export const setupRoutes = (app: Express, db: Pool) => {
  // Initialize services
  const rbacService = new RBACServiceImpl(db);
  const auditService = new AuditServiceImpl(db);
  const authMiddleware = new AuthorizationMiddleware(rbacService, auditService);

  // Health check route
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'user-service',
      timestamp: new Date().toISOString()
    });
  });

  // API status route
  app.get('/api/v1/users/status', (req, res) => {
    res.status(200).json({
      message: 'User Service is running',
      version: '1.0.0'
    });
  });

  // User Management Routes
  app.use('/api/v1/users', createUserRoutes(db));

  // Password Management Routes
  app.use('/api/v1/password', createPasswordRoutes(db));

  // RBAC Routes (Phase 3)
  app.use('/api/v1/rbac', createRBACRouter(rbacService, authMiddleware));

  // Audit Routes (Phase 3)
  app.use('/api/v1/audit', createAuditRouter(auditService, authMiddleware));
}; 