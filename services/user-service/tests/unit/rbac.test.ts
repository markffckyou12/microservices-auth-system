import { RBACServiceImpl } from '../../src/services/rbac';
import { Pool } from 'pg';

// Mock pg module
jest.mock('pg', () => ({
  Pool: jest.fn()
}));

describe('RBAC Service', () => {
  let rbacService: RBACServiceImpl;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    // Create mock pool
    mockPool = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      listeners: jest.fn(),
      listenerCount: jest.fn(),
      eventNames: jest.fn(),
      addListener: jest.fn(),
      once: jest.fn(),
      prependListener: jest.fn(),
      prependOnceListener: jest.fn(),
      setMaxListeners: jest.fn(),
      getMaxListeners: jest.fn(),
      rawListeners: jest.fn(),
      emit: jest.fn()
    } as any;

    rbacService = new RBACServiceImpl(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Role Management', () => {
    it('should create a role successfully', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'admin',
        description: 'Administrator role',
        permissions: ['perm-1', 'perm-2'],
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPool.query.mockResolvedValue({
        rows: [mockRole]
      });

      const result = await rbacService.createRole({
        name: 'admin',
        description: 'Administrator role',
        permissions: ['perm-1', 'perm-2']
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO roles'),
        ['admin', 'Administrator role', '["perm-1","perm-2"]']
      );
      expect(result).toEqual(mockRole);
    });

    it('should get a role by ID', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'admin',
        description: 'Administrator role',
        permissions: '["perm-1","perm-2"]',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPool.query.mockResolvedValue({
        rows: [mockRole]
      });

      const result = await rbacService.getRole('role-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM roles WHERE id = $1',
        ['role-1']
      );
      expect(result).toEqual({
        ...mockRole,
        permissions: ['perm-1', 'perm-2']
      });
    });

    it('should return null for non-existent role', async () => {
      mockPool.query.mockResolvedValue({
        rows: []
      });

      const result = await rbacService.getRole('non-existent');

      expect(result).toBeNull();
    });

    it('should list all roles', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'admin',
          description: 'Administrator role',
          permissions: '["perm-1","perm-2"]',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'role-2',
          name: 'user',
          description: 'User role',
          permissions: '["perm-3"]',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockPool.query.mockResolvedValue({
        rows: mockRoles
      });

      const result = await rbacService.listRoles();

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM roles ORDER BY name'
      );
      expect(result).toHaveLength(2);
      expect(result[0].permissions).toEqual(['perm-1', 'perm-2']);
      expect(result[1].permissions).toEqual(['perm-3']);
    });
  });

  describe('Permission Management', () => {
    it('should create a permission successfully', async () => {
      const mockPermission = {
        id: 'perm-1',
        name: 'read_users',
        resource: 'users',
        action: 'read',
        description: 'Read user data'
      };

      mockPool.query.mockResolvedValue({
        rows: [mockPermission]
      });

      const result = await rbacService.createPermission({
        name: 'read_users',
        resource: 'users',
        action: 'read',
        description: 'Read user data'
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO permissions'),
        ['read_users', 'users', 'read', 'Read user data']
      );
      expect(result).toEqual(mockPermission);
    });

    it('should list all permissions', async () => {
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

      mockPool.query.mockResolvedValue({
        rows: mockPermissions
      });

      const result = await rbacService.listPermissions();

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM permissions ORDER BY resource, action'
      );
      expect(result).toEqual(mockPermissions);
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

      mockPool.query.mockResolvedValue({
        rows: [mockUserRole]
      });

      const result = await rbacService.assignRoleToUser('user-1', 'role-1', 'admin-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_roles'),
        ['user-1', 'role-1', 'admin-1']
      );
      expect(result).toEqual(mockUserRole);
    });

    it('should get user roles', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'admin',
          description: 'Administrator role',
          permissions: '["perm-1","perm-2"]',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockPool.query.mockResolvedValue({
        rows: mockRoles
      });

      const result = await rbacService.getUserRoles('user-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT r.* FROM roles r'),
        ['user-1']
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('admin');
    });

    it('should revoke a role from a user', async () => {
      mockPool.query.mockResolvedValue({
        rowCount: 1
      });

      const result = await rbacService.revokeRoleFromUser('user-1', 'role-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
        ['user-1', 'role-1']
      );
      expect(result).toBe(true);
    });
  });

  describe('Permission Checking', () => {
    it('should check if user has permission', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ count: '1' }]
      });

      const result = await rbacService.checkPermission('user-1', 'users', 'read');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count'),
        ['user-1', 'users', 'read']
      );
      expect(result).toBe(true);
    });

    it('should return false when user lacks permission', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ count: '0' }]
      });

      const result = await rbacService.checkPermission('user-1', 'users', 'delete');

      expect(result).toBe(false);
    });

    it('should check if user has role', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ count: '1' }]
      });

      const result = await rbacService.hasRole('user-1', 'admin');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count'),
        ['user-1', 'admin']
      );
      expect(result).toBe(true);
    });
  });
}); 