import { RBACService } from '../../src/services/rbac';
import { Pool } from 'pg';

// Mock the database pool with proper typing
const mockPool = {
  query: jest.fn()
} as unknown as jest.Mocked<Pool>;

describe('RBAC Service', () => {
  let rbacService: RBACService;

  beforeEach(() => {
    rbacService = new RBACService(mockPool);
    jest.clearAllMocks();
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'admin',
        description: 'Administrator role',
        permissions: ['users:read', 'users:write'],
        created_at: new Date(),
        updated_at: new Date()
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [mockRole]
      });

      const result = await rbacService.createRole({
        name: 'admin',
        description: 'Administrator role'
      });

      expect(result).toEqual(mockRole);
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO roles (name, description, parent_role_id) VALUES ($1, $2, $3) RETURNING *',
        ['admin', 'Administrator role', undefined]
      );
    });
  });

  describe('getRoleById', () => {
    it('should get role by id', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'admin',
        description: 'Administrator role',
        permissions: ['users:read', 'users:write'],
        created_at: new Date(),
        updated_at: new Date()
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [mockRole]
      });

      const result = await rbacService.getRoleById('role-1');

      expect(result).toEqual(mockRole);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM roles WHERE id = $1',
        ['role-1']
      );
    });

    it('should return null if role not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: []
      });

      const result = await rbacService.getRoleById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllRoles', () => {
    it('should get all roles', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'admin',
          description: 'Administrator role',
          permissions: ['users:read', 'users:write'],
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'role-2',
          name: 'user',
          description: 'User role',
          permissions: ['users:read'],
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockRoles
      });

      const result = await rbacService.getAllRoles();

      expect(result).toEqual(mockRoles);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM roles ORDER BY name');
    });
  });

  describe('createPermission', () => {
    it('should create a new permission', async () => {
      const mockPermission = {
        id: 'perm-1',
        name: 'read_users',
        resource: 'users',
        action: 'read',
        description: 'Read user data'
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [mockPermission]
      });

      const result = await rbacService.createPermission({
        name: 'read_users',
        resource: 'users',
        action: 'read',
        description: 'Read user data'
      });

      expect(result).toEqual(mockPermission);
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO permissions (name, resource, action, description) VALUES ($1, $2, $3, $4) RETURNING *',
        ['read_users', 'users', 'read', 'Read user data']
      );
    });
  });

  describe('getAllPermissions', () => {
    it('should get all permissions', async () => {
      const mockPermissions = [
        {
          id: 'perm-1',
          name: 'read_users',
          resource: 'users',
          action: 'read',
          description: 'Read user data'
        },
        {
          id: 'perm-2',
          name: 'write_users',
          resource: 'users',
          action: 'write',
          description: 'Write user data'
        }
      ];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockPermissions
      });

      const result = await rbacService.getAllPermissions();

      expect(result).toEqual(mockPermissions);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM permissions ORDER BY resource, action');
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user', async () => {
      const mockUserRole = {
        user_id: 'user-1',
        role_id: 'role-1',
        assigned_at: new Date(),
        assigned_by: 'admin'
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [mockUserRole]
      });

      const result = await rbacService.assignRoleToUser('user-1', 'role-1', 'admin');

      expect(result).toEqual(mockUserRole);
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3) RETURNING *',
        ['user-1', 'role-1', 'admin']
      );
    });
  });

  describe('getUserRoles', () => {
    it('should get user roles', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'admin',
          description: 'Administrator role',
          permissions: ['users:read', 'users:write'],
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockRoles
      });

      const result = await rbacService.getUserRoles('user-1');

      expect(result).toEqual(mockRoles);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT r.* FROM roles r'),
        ['user-1']
      );
    });
  });

  describe('checkPermission', () => {
    it('should check user permission', async () => {
      // Mock user roles
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'role-1', permissions: ['users:read'] }]
      });

      // Mock permission check
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ count: '1' }]
      });

      const result = await rbacService.checkPermission('user-1', 'users', 'read');

      expect(result).toBe(true);
    });

    it('should return false for user without roles', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: []
      });

      const result = await rbacService.checkPermission('user-1', 'users', 'read');

      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should check if user has role', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ count: '1' }]
      });

      const result = await rbacService.hasRole('user-1', 'admin');

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM user_roles ur'),
        ['user-1', 'admin']
      );
    });
  });

  describe('getRoleWithPermissions', () => {
    it('should get role with permissions', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'admin',
        description: 'Administrator role',
        created_at: new Date(),
        updated_at: new Date()
      };
      const mockPermissions = [
        {
          id: 'perm-1',
          name: 'read_users',
          resource: 'users',
          action: 'read',
          description: 'Read user data',
          created_at: new Date()
        }
      ];

      // Mock getRoleById
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockRole] }) // getRoleById
        .mockResolvedValueOnce({ rows: mockPermissions }) // direct permissions
        .mockResolvedValueOnce({ rows: [] }); // inherited permissions

      const result = await rbacService.getRoleWithPermissions('role-1');

      expect(result).toMatchObject({
        ...mockRole,
        permissions: mockPermissions,
        inherited_permissions: []
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WITH RECURSIVE role_hierarchy'),
        ['role-1']
      );
    });
  });
});