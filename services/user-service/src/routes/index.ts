import { Router } from 'express';
import { Pool } from 'pg';
import { setupUserRoutes } from './user';
import setupPasswordRoutes from './password';
import { setupRBACRoutes } from './rbac';
import { setupAuditRoutes } from './audit';
import { RBACService } from '../services/rbac';
import { AuditServiceImpl } from '../services/audit';
import { PasswordServiceImpl } from '../services/password';

export function setupRoutes(app: Router, db: Pool) {
  // Initialize services
  const rbacService = new RBACService(db);
  const auditService = new AuditServiceImpl(db);
  const passwordService = new PasswordServiceImpl(db);

  // Setup route groups
  app.use('/auth/password', setupPasswordRoutes(passwordService));
  app.use('/auth/rbac', setupRBACRoutes(rbacService));
  app.use('/auth/audit', setupAuditRoutes(auditService));
  app.use('/auth/users', setupUserRoutes(db));
} 