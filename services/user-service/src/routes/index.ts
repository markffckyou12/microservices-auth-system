import { Router } from 'express';
import { Pool } from 'pg';
import setupUserRoutes from './user';
import { createRBACRouter } from './rbac';
import { createAuditRouter } from './audit';
import createPasswordRouter from './password';
import { RBACService } from '../services/rbac';
import { AuditServiceImpl } from '../services/audit';
import { PasswordServiceImpl } from '../services/password';

export function setupRoutes(db: Pool): Router {
  const router = Router();

  // Initialize services
  const rbacService = new RBACService(db);
  const auditService = new AuditServiceImpl(db);
  const passwordService = new PasswordServiceImpl(db);

  // Setup routes
  setupUserRoutes(db, router);
  router.use('/rbac', createRBACRouter(rbacService));
  router.use('/audit', createAuditRouter(auditService));
  router.use('/password', createPasswordRouter(passwordService));

  return router;
} 