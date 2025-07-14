import { Router } from 'express';
import { Pool } from 'pg';
import setupUserRoutes from './user';
import { createRBACRouter } from './rbac';
import { createAuditRouter } from './audit';
import { createPasswordRouter } from './password';
import { RBACService } from '../services/rbac';
import { AuditService } from '../services/audit';
import { PasswordService } from '../services/password';

export function setupRoutes(db: Pool): Router {
  const router = Router();

  // Initialize services
  const rbacService = new RBACService(db);
  const auditService = new AuditService(db);
  const passwordService = new PasswordService(db);

  // Setup routes
  setupUserRoutes(db, router);
  router.use('/rbac', createRBACRouter(rbacService));
  router.use('/audit', createAuditRouter(auditService));
  router.use('/password', createPasswordRouter(passwordService));

  return router;
} 