import { Pool } from 'pg';

export interface Role {
  id: string;
  name: string;
  description?: string;
  parent_role_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: Date;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
  granted: boolean;
  created_at: Date;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_at: Date;
  assigned_by?: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  parent_role_id?: string;
}

export interface CreatePermissionData {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
  inherited_permissions: Permission[];
}

export class RBACService {
  constructor(private db: Pool) {}

  async createRole(data: CreateRoleData): Promise<Role> {
    const { name, description, parent_role_id } = data;
    
    const result = await this.db.query(
      'INSERT INTO roles (name, description, parent_role_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, parent_role_id]
    );
    
    return result.rows[0];
  }

  async getRoleById(id: string): Promise<Role | null> {
    const result = await this.db.query(
      'SELECT * FROM roles WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }

  async getRoleByName(name: string): Promise<Role | null> {
    const result = await this.db.query(
      'SELECT * FROM roles WHERE name = $1',
      [name]
    );
    
    return result.rows[0] || null;
  }

  // Alias for getRoleById for backward compatibility
  async getRole(id: string): Promise<Role | null> {
    return this.getRoleById(id);
  }

  async getAllRoles(): Promise<Role[]> {
    const result = await this.db.query('SELECT * FROM roles ORDER BY name');
    return result.rows;
  }

  // Alias for getAllRoles for backward compatibility
  async listRoles(): Promise<Role[]> {
    return this.getAllRoles();
  }

  async updateRole(id: string, data: CreateRoleData): Promise<Role | null> {
    const { name, description, parent_role_id } = data;
    
    const result = await this.db.query(
      'UPDATE roles SET name = $1, description = $2, parent_role_id = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, description, parent_role_id, id]
    );
    
    return result.rows[0] || null;
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM roles WHERE id = $1',
      [id]
    );
    
    return (result.rowCount || 0) > 0;
  }

  async createPermission(data: CreatePermissionData): Promise<Permission> {
    const { name, resource, action, description } = data;
    
    const result = await this.db.query(
      'INSERT INTO permissions (name, resource, action, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, resource, action, description]
    );
    
    return result.rows[0];
  }

  async getPermission(id: string): Promise<Permission | null> {
    const result = await this.db.query(
      'SELECT * FROM permissions WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }

  async getAllPermissions(): Promise<Permission[]> {
    const result = await this.db.query('SELECT * FROM permissions ORDER BY resource, action');
    return result.rows;
  }

  // Alias for getAllPermissions for backward compatibility
  async listPermissions(): Promise<Permission[]> {
    return this.getAllPermissions();
  }

  async assignRoleToUser(userId: string, roleId: string, assignedBy?: string): Promise<UserRole> {
    const result = await this.db.query(
      'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3) RETURNING *',
      [userId, roleId, assignedBy]
    );
    
    return result.rows[0];
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const result = await this.db.query(
      `SELECT r.* FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1
       ORDER BY r.name`,
      [userId]
    );
    
    return result.rows;
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );
    
    return (result.rowCount || 0) > 0;
  }

  // Alias for removeRoleFromUser for backward compatibility
  async revokeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    return this.removeRoleFromUser(userId, roleId);
  }

  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND r.name = $2`,
      [userId, roleName]
    );
    
    return parseInt(result.rows[0].count) > 0;
  }

  async getRoleHierarchy(roleId: string): Promise<Role[]> {
    const result = await this.db.query(
      `WITH RECURSIVE role_hierarchy AS (
         SELECT id, name, description, parent_role_id, 0 as level
         FROM roles WHERE id = $1
         UNION ALL
         SELECT r.id, r.name, r.description, r.parent_role_id, rh.level + 1
         FROM roles r
         INNER JOIN role_hierarchy rh ON r.id = rh.parent_role_id
       )
       SELECT * FROM role_hierarchy ORDER BY level`,
      [roleId]
    );
    
    return result.rows;
  }

  async getRoleWithPermissions(roleId: string): Promise<RoleWithPermissions | null> {
    // Get the role
    const role = await this.getRoleById(roleId);
    if (!role) return null;

    // Get direct permissions
    const directPermissionsResult = await this.db.query(
      `SELECT p.* FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1 AND rp.granted = true`,
      [roleId]
    );

    // Get inherited permissions through role hierarchy
    const hierarchyRoles = await this.getRoleHierarchy(roleId);
    const inheritedPermissionsResult = await this.db.query(
      `SELECT DISTINCT p.* FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN roles r ON rp.role_id = r.id
       WHERE r.id = ANY($1) AND rp.granted = true`,
      [hierarchyRoles.map(r => r.id)]
    );

    return {
      ...role,
      permissions: directPermissionsResult.rows,
      inherited_permissions: inheritedPermissionsResult.rows
    };
  }

  async addPermissionToRole(roleId: string, permissionId: string): Promise<boolean> {
    const result = await this.db.query(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT (role_id, permission_id) DO NOTHING',
      [roleId, permissionId]
    );
    
    return (result.rowCount || 0) > 0;
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
      [roleId, permissionId]
    );
    
    return (result.rowCount || 0) > 0;
  }

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    // Get all user roles with their hierarchy
    const userRoles = await this.getUserRoles(userId);
    if (userRoles.length === 0) {
      return false;
    }

    // Check if any role in the hierarchy has the required permission
    const result = await this.db.query(
      `WITH RECURSIVE user_role_hierarchy AS (
         SELECT ur.role_id, r.parent_role_id, 0 as level
         FROM user_roles ur
         INNER JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = $1
         UNION ALL
         SELECT r.id, r.parent_role_id, urh.level + 1
         FROM roles r
         INNER JOIN user_role_hierarchy urh ON r.id = urh.parent_role_id
       )
       SELECT COUNT(*) as count FROM role_permissions rp
       INNER JOIN user_role_hierarchy urh ON rp.role_id = urh.role_id
       INNER JOIN permissions p ON rp.permission_id = p.id
       WHERE p.resource = $2 AND p.action = $3 AND rp.granted = true`,
      [userId, resource, action]
    );
    
    return parseInt(result.rows[0].count) > 0;
  }

  // Alias for checkPermission for backward compatibility
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    return this.checkPermission(userId, resource, action);
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const result = await this.db.query(
      `WITH RECURSIVE user_role_hierarchy AS (
         SELECT ur.role_id, r.parent_role_id, 0 as level
         FROM user_roles ur
         INNER JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = $1
         UNION ALL
         SELECT r.id, r.parent_role_id, urh.level + 1
         FROM roles r
         INNER JOIN user_role_hierarchy urh ON r.id = urh.parent_role_id
       )
       SELECT DISTINCT p.* FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN user_role_hierarchy urh ON rp.role_id = urh.role_id
       WHERE rp.granted = true
       ORDER BY p.resource, p.action`,
      [userId]
    );
    
    return result.rows;
  }
}