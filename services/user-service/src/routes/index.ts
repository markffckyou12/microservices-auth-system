import { Router } from 'express';
import { Pool } from 'pg';
import setupUserRoutes from './user';
import setupUserManagementRoutes from './userManagement';
import { createRBACRouter } from './rbac';
import { createAuditRouter } from './audit';
import createPasswordRouter from './password';
import { RBACService } from '../services/rbac';
import { AuditServiceImpl } from '../services/audit';
import { PasswordServiceImpl } from '../services/password';
import { authenticateJwt } from '../middleware/authorization';

export function setupRoutes(db: Pool): Router {
  const router = Router();

  // Initialize services
  const rbacService = new RBACService(db);
  const auditService = new AuditServiceImpl(db);
  const passwordService = new PasswordServiceImpl(db);

  // Setup routes
  const userRouter = setupUserRoutes(db);
  const userManagementRouter = setupUserManagementRoutes(db);
  
  // User profile routes (existing)
  router.use('/users', authenticateJwt, userRouter);
  
  // User management routes (new)
  router.use('/user-management', authenticateJwt, userManagementRouter);
  
  router.use('/rbac', createRBACRouter(rbacService));
  router.use('/audit', createAuditRouter(auditService));
  router.use('/password', createPasswordRouter(passwordService));

  return router;
} 