import { Pool } from 'pg';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_at: Date;
  assigned_by: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface CreatePermissionData {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export class RBACService {
  constructor(private db: Pool) {}

  async createRole(data: CreateRoleData): Promise<Role> {
    const { name, description, permissions = [] } = data;
    
    const result = await this.db.query(
      'INSERT INTO roles (name, description, permissions) VALUES ($1, $2, $3) RETURNING *',
      [name, description, permissions]
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

  async getAllRoles(): Promise<Role[]> {
    const result = await this.db.query('SELECT * FROM roles ORDER BY name');
    return result.rows;
  }

  async updateRole(id: string, data: CreateRoleData): Promise<Role | null> {
    const { name, description, permissions = [] } = data;
    
    const result = await this.db.query(
      'UPDATE roles SET name = $1, description = $2, permissions = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, description, permissions, id]
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

  async getAllPermissions(): Promise<Permission[]> {
    const result = await this.db.query('SELECT * FROM permissions ORDER BY resource, action');
    return result.rows;
  }

  async assignRoleToUser(userId: string, roleId: string, assignedBy: string): Promise<UserRole> {
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

  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND r.name = $2`,
      [userId, roleName]
    );
    
    return parseInt(result.rows[0].count) > 0;
  }

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    // First check if user has any roles
    const userRoles = await this.getUserRoles(userId);
    if (userRoles.length === 0) {
      return false;
    }

    // Check if any of the user's roles have the required permission
    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND $2 = ANY(r.permissions)`,
      [userId, `${resource}:${action}`]
    );
    
    return parseInt(result.rows[0].count) > 0;
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const result = await this.db.query(
      `SELECT p.* FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.resource, p.action`,
      [roleId]
    );
    
    return result.rows;
  }
} 