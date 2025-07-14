import request from 'supertest';
import express from 'express';
import { createRBACRouter } from '../../src/routes/rbac';
import { RBACService } from '../../src/services/rbac';
import { AuditService } from '../../src/services/audit';
import { AuthorizationMiddleware } from '../../src/middleware/authorization';

// Mock services
const mockRBACService: jest.Mocked<RBACService> = {
  createRole: jest.fn(),
  getRole: jest.fn(),
  updateRole: jest.fn(),
  deleteRole: jest.fn(),
  listRoles: jest.fn(),
  createPermission: jest.fn(),
  getPermission: jest.fn(),
  listPermissions: jest.fn(),
  assignRoleToUser: jest.fn(),
  revokeRoleFromUser: jest.fn(),
  getUserRoles: jest.fn(),
  getUserPermissions: jest.fn(),
  checkPermission: jest.fn(),
  hasRole: jest.fn()
};

const mockAuditService: jest.Mocked<AuditService> = {
  logAction: jest.fn(),
  getAuditLog: jest.fn(),
  logSecurityEvent: jest.fn(),
  getSecurityEvents: jest.fn(),
  generateComplianceReport: jest.fn()
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
    mockAuthMiddleware.requirePermission.mockReturnValue((req, res, next) => next());
    mockAuthMiddleware.requireOwnershipOrPermission.mockReturnValue((req, res, next) => next());

    const rbacRouter = createRBACRouter(mockRBACService, mockAuthMiddleware);
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
        permissions: ['perm-1', 'perm-2'],
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRBACService.createRole.mockResolvedValue(mockRole);

      const response = await request(app)
        .post('/api/v1/rbac/roles')
        .send({
          name: 'admin',
          description: 'Administrator role',
          permissions: ['perm-1', 'perm-2']
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Role created successfully',
        role: mockRole
      });
      expect(mockRBACService.createRole).toHaveBeenCalledWith({
        name: 'admin',
        description: 'Administrator role',
        permissions: ['perm-1', 'perm-2']
      });
    });

    it('should list roles', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'admin',
          description: 'Administrator role',
          permissions: ['perm-1', 'perm-2'],
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockRBACService.listRoles.mockResolvedValue(mockRoles);

      const response = await request(app)
        .get('/api/v1/rbac/roles');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ roles: mockRoles });
      expect(mockRBACService.listRoles).toHaveBeenCalled();
    });

    it('should get a role by ID', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'admin',
        description: 'Administrator role',
        permissions: ['perm-1', 'perm-2'],
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRBACService.getRole.mockResolvedValue(mockRole);

      const response = await request(app)
        .get('/api/v1/rbac/roles/role-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ role: mockRole });
      expect(mockRBACService.getRole).toHaveBeenCalledWith('role-1');
    });

    it('should return 404 for non-existent role', async () => {
      mockRBACService.getRole.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/rbac/roles/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Role not found' });
    });
  });

  describe('Permission Management', () => {
    it('should create a permission', async () => {
      const mockPermission = {
        id: 'perm-1',
        name: 'read_users',
        resource: 'users',
        action: 'read',
        description: 'Read user data'
      };

      mockRBACService.createPermission.mockResolvedValue(mockPermission);

      const response = await request(app)
        .post('/api/v1/rbac/permissions')
        .send({
          name: 'read_users',
          resource: 'users',
          action: 'read',
          description: 'Read user data'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Permission created successfully',
        permission: mockPermission
      });
    });

    it('should list permissions', async () => {
      const mockPermissions = [
        {
          id: 'perm-1',
          name: 'read_users',
          resource: 'users',
          action: 'read',
          description: 'Read user data'
        }
      ];

      mockRBACService.listPermissions.mockResolvedValue(mockPermissions);

      const response = await request(app)
        .get('/api/v1/rbac/permissions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ permissions: mockPermissions });
    });
  });

  describe('User Role Assignment', () => {
    it('should assign a role to a user', async () => {
      const mockUserRole = {
        user_id: 'user-1',
        role_id: 'role-1',
        assigned_at: new Date(),
        assigned_by: 'admin-1'
      };

      mockRBACService.assignRoleToUser.mockResolvedValue(mockUserRole);

      const response = await request(app)
        .post('/api/v1/rbac/users/user-1/roles')
        .send({
          roleId: 'role-1'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Role assigned successfully',
        userRole: mockUserRole
      });
      expect(mockRBACService.assignRoleToUser).toHaveBeenCalledWith('user-1', 'role-1', 'user-1');
    });

    it('should get user roles', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'admin',
          description: 'Administrator role',
          permissions: ['perm-1', 'perm-2'],
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockRBACService.getUserRoles.mockResolvedValue(mockRoles);

      const response = await request(app)
        .get('/api/v1/rbac/users/user-1/roles');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ roles: mockRoles });
      expect(mockRBACService.getUserRoles).toHaveBeenCalledWith('user-1');
    });

    it('should revoke a role from a user', async () => {
      mockRBACService.revokeRoleFromUser.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/v1/rbac/users/user-1/roles/role-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Role revoked successfully' });
      expect(mockRBACService.revokeRoleFromUser).toHaveBeenCalledWith('user-1', 'role-1');
    });
  });

  describe('Permission Checking', () => {
    it('should check user permission', async () => {
      mockRBACService.checkPermission.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/rbac/check-permission')
        .send({
          userId: 'user-1',
          resource: 'users',
          action: 'read'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        hasPermission: true,
        userId: 'user-1',
        resource: 'users',
        action: 'read'
      });
      expect(mockRBACService.checkPermission).toHaveBeenCalledWith('user-1', 'users', 'read');
    });
  });
}); 