-- Phase 3: RBAC and Audit Logging Migration
-- Based on Creative Phase Design Decisions

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;

-- Roles table with hierarchy support (Hierarchical RBAC)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_role_id UUID REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource, action)
);

-- Role-permission assignments
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- User-role assignments
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- Single Audit Logs table with JSON payload (Creative Phase Decision)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_details ON audit_logs USING GIN(details);

-- Role hierarchy indexes
CREATE INDEX idx_roles_parent_role_id ON roles(parent_role_id);
CREATE INDEX idx_roles_name ON roles(name);

-- Permission indexes
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_permissions_name ON permissions(name);

-- Role permission indexes
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- User role indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('admin', 'System administrator with full access'),
    ('manager', 'Manager with elevated permissions'),
    ('user', 'Standard user with basic permissions'),
    ('guest', 'Guest user with limited access')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    -- User management permissions
    ('user:read', 'user', 'read', 'Read user information'),
    ('user:write', 'user', 'write', 'Create or update users'),
    ('user:delete', 'user', 'delete', 'Delete users'),
    ('user:list', 'user', 'list', 'List all users'),
    
    -- Role management permissions
    ('role:read', 'role', 'read', 'Read role information'),
    ('role:write', 'role', 'write', 'Create or update roles'),
    ('role:delete', 'role', 'delete', 'Delete roles'),
    ('role:list', 'role', 'list', 'List all roles'),
    
    -- Permission management permissions
    ('permission:read', 'permission', 'read', 'Read permission information'),
    ('permission:write', 'permission', 'write', 'Create or update permissions'),
    ('permission:delete', 'permission', 'delete', 'Delete permissions'),
    ('permission:list', 'permission', 'list', 'List all permissions'),
    
    -- Audit permissions
    ('audit:read', 'audit', 'read', 'Read audit logs'),
    ('audit:list', 'audit', 'list', 'List audit logs'),
    ('audit:export', 'audit', 'export', 'Export audit logs'),
    
    -- Profile permissions
    ('profile:read', 'profile', 'read', 'Read own profile'),
    ('profile:write', 'profile', 'write', 'Update own profile'),
    ('profile:read_others', 'profile', 'read_others', 'Read other user profiles'),
    ('profile:write_others', 'profile', 'write_others', 'Update other user profiles')
ON CONFLICT (resource, action) DO NOTHING;

-- Set up role hierarchy (admin -> manager -> user -> guest)
UPDATE roles SET parent_role_id = (SELECT id FROM roles WHERE name = 'manager') WHERE name = 'admin';
UPDATE roles SET parent_role_id = (SELECT id FROM roles WHERE name = 'user') WHERE name = 'manager';
UPDATE roles SET parent_role_id = (SELECT id FROM roles WHERE name = 'guest') WHERE name = 'user';

-- Assign permissions to roles
-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'admin'),
    id
FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager gets most permissions except sensitive admin functions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'manager'),
    id
FROM permissions 
WHERE name NOT IN ('role:delete', 'permission:delete', 'user:delete')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- User gets basic permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'user'),
    id
FROM permissions 
WHERE name IN ('profile:read', 'profile:write', 'user:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Guest gets minimal permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'guest'),
    id
FROM permissions 
WHERE name IN ('profile:read')
ON CONFLICT (role_id, permission_id) DO NOTHING; 