import request from 'supertest';
import express from 'express';
import { setupRBACRoutes } from '../../src/routes/rbac';
import { RBACService } from '../../src/services/rbac';
import { AuditService } from '../../src/services/audit';
import { AuthorizationMiddleware } from '../../src/middleware/authorization';
import { Pool } from 'pg';

// Mock services - don't use jest.Mocked for RBACService due to private db property
const mockRBACService: jest.Mocked<RBACService> = {
  createRole: jest.fn(),
  getRoleById: jest.fn(),
  getRoleByName: jest.fn(),
  getRole: jest.fn(),
  getAllRoles: jest.fn(),
  listRoles: jest.fn(),
  updateRole: jest.fn(),
  deleteRole: jest.fn(),
  createPermission: jest.fn(),
  getPermission: jest.fn(),
  getAllPermissions: jest.fn(),
  listPermissions: jest.fn(),
  assignRoleToUser: jest.fn(),
  getUserRoles: jest.fn(),
  removeRoleFromUser: jest.fn(),
  revokeRoleFromUser: jest.fn(),
  hasRole: jest.fn(),
  getRoleHierarchy: jest.fn(),
  getRoleWithPermissions: jest.fn(),
  addPermissionToRole: jest.fn(),
  removePermissionFromRole: jest.fn(),
  checkPermission: jest.fn(),
  hasPermission: jest.fn(),
  getUserPermissions: jest.fn()
} as any;

const mockAuditService: jest.Mocked<AuditService> = {
  logEvent: jest.fn(),
  getAuditLogs: jest.fn(),
  getAuditLogById: jest.fn(),
  getAuditSummary: jest.fn(),
  getUserActivity: jest.fn(),
  generateComplianceReport: jest.fn(),
  exportAuditLogs: jest.fn()
};

const mockAuthMiddleware: jest.Mocked<AuthorizationMiddleware> = {
  requirePermission: jest.fn(),
  requireRole: jest.fn(),
  requireAnyRole: jest.fn(),
  requireOwnershipOrPermission: jest.fn(),
  rateLimitByRole: jest.fn()
} as any;

describe('RBAC Routes Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['admin']
      };
      next();
    });

    // Mock authorization middleware to always pass
    mockAuthMiddleware.requirePermission.mockReturnValue(async (req, res, next) => next());
    mockAuthMiddleware.requireOwnershipOrPermission.mockReturnValue(async (req, res, next) => next());

    const rbacRouter = setupRBACRoutes(mockRBACService);
    app.use('/api/v1/rbac', rbacRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Role Management', () => {
    it('should create a role', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'admin',
        description: 'Administrator role',
        created_at: expect.any(String),
        updated_at: expect.any(String)
      };

      mockRBACService.createRole.mockResolvedValue({
        id: 'role-1',
        name: 'admin',
        description: 'Administrator role',
        created_at: new Date(),
        updated_at: new Date()
      });

      const response = await request(app)
        .post('/api/v1/rbac/roles')
        .send({
          name: 'admin',
          description: 'Administrator role'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(mockRole);
      expect(mockRBACService.createRole).toHaveBeenCalledWith({
        name: 'admin',
        description: 'Administrator role'
      });
    });

    it('should list roles', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'admin',
          description: 'Administrator role',
          created_at: expect.any(String),
          updated_at: expect.any(String)
        }
      ];

      mockRBACService.getAllRoles.mockResolvedValue([
        {
          id: 'role-1',
          name: 'admin',
          description: 'Administrator role',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);

      const response = await request(app)
        .get('/api/v1/rbac/roles');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(mockRoles);
      expect(mockRBACService.getAllRoles).toHaveBeenCalled();
    });

    it('should get a role by ID', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'admin',
        description: 'Administrator role',
        created_at: expect.any(String),
        updated_at: expect.any(String)
      };

      mockRBACService.getRoleById.mockResolvedValue({
        id: 'role-1',
        name: 'admin',
        description: 'Administrator role',
        created_at: new Date(),
        updated_at: new Date()
      });

      const response = await request(app)
        .get('/api/v1/rbac/roles/role-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(mockRole);
      expect(mockRBACService.getRoleById).toHaveBeenCalledWith('role-1');
    });

    it('should return 404 for non-existent role', async () => {
      mockRBACService.getRoleById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/rbac/roles/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Role not found');
    });
  });

  describe('Permission Management', () => {
    it('should create a permission', async () => {
      const mockPermission = {
        id: 'perm-1',
        name: 'read_users',
        resource: 'users',
        action: 'read',
        description: 'Read user data',
        created_at: expect.any(String)
      };

      mockRBACService.createPermission.mockResolvedValue({
        id: 'perm-1',
        name: 'read_users',
        resource: 'users',
        action: 'read',
        description: 'Read user data',
        created_at: new Date()
      });

      const response = await request(app)
        .post('/api/v1/rbac/permissions')
        .send({
          name: 'read_users',
          resource: 'users',
          action: 'read',
          description: 'Read user data'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(mockPermission);
    });

    it('should list permissions', async () => {
      const mockPermissions = [
        {
          id: 'perm-1',
          name: 'read_users',
          resource: 'users',
          action: 'read',
          description: 'Read user data',
          created_at: expect.any(String)
        }
      ];

      mockRBACService.getAllPermissions.mockResolvedValue([
        {
          id: 'perm-1',
          name: 'read_users',
          resource: 'users',
          action: 'read',
          description: 'Read user data',
          created_at: new Date()
        }
      ]);

      const response = await request(app)
        .get('/api/v1/rbac/permissions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(mockPermissions);
    });
  });
});