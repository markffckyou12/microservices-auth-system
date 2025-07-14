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

export interface RBACService {
  createRole(role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role>;
  getRole(roleId: string): Promise<Role | null>;
  updateRole(roleId: string, updates: Partial<Role>): Promise<Role | null>;
  deleteRole(roleId: string): Promise<boolean>;
  listRoles(): Promise<Role[]>;
  
  createPermission(permission: Omit<Permission, 'id'>): Promise<Permission>;
  getPermission(permissionId: string): Promise<Permission | null>;
  listPermissions(): Promise<Permission[]>;
  
  assignRoleToUser(userId: string, roleId: string, assignedBy: string): Promise<UserRole>;
  revokeRoleFromUser(userId: string, roleId: string): Promise<boolean>;
  getUserRoles(userId: string): Promise<Role[]>;
  getUserPermissions(userId: string): Promise<Permission[]>;
  
  checkPermission(userId: string, resource: string, action: string): Promise<boolean>;
  hasRole(userId: string, roleName: string): Promise<boolean>;
}

export class RBACServiceImpl implements RBACService {
  constructor(private db: Pool) {}

  async createRole(role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    const query = `
      INSERT INTO roles (name, description, permissions)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await this.db.query(query, [
      role.name,
      role.description,
      JSON.stringify(role.permissions)
    ]);
    
    return this.mapRoleFromDb(result.rows[0]);
  }

  async getRole(roleId: string): Promise<Role | null> {
    const query = 'SELECT * FROM roles WHERE id = $1';
    const result = await this.db.query(query, [roleId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRoleFromDb(result.rows[0]);
  }

  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role | null> {
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE roles 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [roleId, ...Object.values(updates).filter((_, index) => index !== 0)];
    const result = await this.db.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRoleFromDb(result.rows[0]);
  }

  async deleteRole(roleId: string): Promise<boolean> {
    const query = 'DELETE FROM roles WHERE id = $1';
    const result = await this.db.query(query, [roleId]);
    return result.rowCount > 0;
  }

  async listRoles(): Promise<Role[]> {
    const query = 'SELECT * FROM roles ORDER BY name';
    const result = await this.db.query(query);
    return result.rows.map(row => this.mapRoleFromDb(row));
  }

  async createPermission(permission: Omit<Permission, 'id'>): Promise<Permission> {
    const query = `
      INSERT INTO permissions (name, resource, action, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await this.db.query(query, [
      permission.name,
      permission.resource,
      permission.action,
      permission.description
    ]);
    
    return result.rows[0];
  }

  async getPermission(permissionId: string): Promise<Permission | null> {
    const query = 'SELECT * FROM permissions WHERE id = $1';
    const result = await this.db.query(query, [permissionId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  async listPermissions(): Promise<Permission[]> {
    const query = 'SELECT * FROM permissions ORDER BY resource, action';
    const result = await this.db.query(query);
    return result.rows;
  }

  async assignRoleToUser(userId: string, roleId: string, assignedBy: string): Promise<UserRole> {
    const query = `
      INSERT INTO user_roles (user_id, role_id, assigned_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, role_id) DO NOTHING
      RETURNING *
    `;
    
    const result = await this.db.query(query, [userId, roleId, assignedBy]);
    
    if (result.rows.length === 0) {
      // Role already assigned
      const existingQuery = 'SELECT * FROM user_roles WHERE user_id = $1 AND role_id = $2';
      const existingResult = await this.db.query(existingQuery, [userId, roleId]);
      return existingResult.rows[0];
    }
    
    return result.rows[0];
  }

  async revokeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    const query = 'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2';
    const result = await this.db.query(query, [userId, roleId]);
    return result.rowCount > 0;
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const query = `
      SELECT r.* 
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
      ORDER BY r.name
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows.map(row => this.mapRoleFromDb(row));
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const query = `
      SELECT DISTINCT p.*
      FROM permissions p
      JOIN roles r ON p.id = ANY(r.permissions)
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
      ORDER BY p.resource, p.action
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM permissions p
      JOIN roles r ON p.id = ANY(r.permissions)
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND p.resource = $2 AND p.action = $3
    `;
    
    const result = await this.db.query(query, [userId, resource, action]);
    return parseInt(result.rows[0].count) > 0;
  }

  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND r.name = $2
    `;
    
    const result = await this.db.query(query, [userId, roleName]);
    return parseInt(result.rows[0].count) > 0;
  }

  private mapRoleFromDb(row: any): Role {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      permissions: Array.isArray(row.permissions) ? row.permissions : JSON.parse(row.permissions || '[]'),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
} 