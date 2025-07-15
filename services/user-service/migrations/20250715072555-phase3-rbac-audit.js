'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Drop existing tables if they exist (for clean migration)
    await queryInterface.dropTable('user_roles', { force: true });
    await queryInterface.dropTable('role_permissions', { force: true });
    await queryInterface.dropTable('permissions', { force: true });
    await queryInterface.dropTable('roles', { force: true });
    await queryInterface.dropTable('audit_logs', { force: true });
    await queryInterface.dropTable('security_events', { force: true });

    // Create roles table with hierarchy support
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      parent_role_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'roles',
          key: 'id'
        }
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create permissions table
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      resource: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add unique constraint for resource and action
    await queryInterface.addConstraint('permissions', {
      fields: ['resource', 'action'],
      type: 'unique',
      name: 'permissions_resource_action_unique'
    });

    // Create role_permissions table
    await queryInterface.createTable('role_permissions', {
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      permission_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      granted: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add primary key for role_permissions
    await queryInterface.addConstraint('role_permissions', {
      fields: ['role_id', 'permission_id'],
      type: 'primary key',
      name: 'role_permissions_pkey'
    });

    // Create user_roles table
    await queryInterface.createTable('user_roles', {
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      assigned_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      assigned_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    });

    // Add primary key for user_roles
    await queryInterface.addConstraint('user_roles', {
      fields: ['user_id', 'role_id'],
      type: 'primary key',
      name: 'user_roles_pkey'
    });

    // Create audit_logs table
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      event_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      resource_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      resource_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.INET,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes for performance
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['event_type']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
    await queryInterface.addIndex('audit_logs', ['details'], { using: 'GIN' });

    // Create role hierarchy indexes
    await queryInterface.addIndex('roles', ['parent_role_id']);
    await queryInterface.addIndex('roles', ['name']);

    // Create permission indexes
    await queryInterface.addIndex('permissions', ['resource', 'action']);
    await queryInterface.addIndex('permissions', ['name']);

    // Create role permission indexes
    await queryInterface.addIndex('role_permissions', ['role_id']);
    await queryInterface.addIndex('role_permissions', ['permission_id']);

    // Create user role indexes
    await queryInterface.addIndex('user_roles', ['user_id']);
    await queryInterface.addIndex('user_roles', ['role_id']);

    // Insert default roles
    await queryInterface.bulkInsert('roles', [
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'admin',
        description: 'System administrator with full access',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'manager',
        description: 'Manager with elevated permissions',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'user',
        description: 'Standard user with basic permissions',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'guest',
        description: 'Guest user with limited access',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Insert default permissions
    await queryInterface.bulkInsert('permissions', [
      // User management permissions
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'user:read',
        resource: 'user',
        action: 'read',
        description: 'Read user information',
        created_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'user:write',
        resource: 'user',
        action: 'write',
        description: 'Create or update users',
        created_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'user:delete',
        resource: 'user',
        action: 'delete',
        description: 'Delete users',
        created_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'user:list',
        resource: 'user',
        action: 'list',
        description: 'List all users',
        created_at: new Date()
      },
      // Role management permissions
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'role:read',
        resource: 'role',
        action: 'read',
        description: 'Read role information',
        created_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'role:write',
        resource: 'role',
        action: 'write',
        description: 'Create or update roles',
        created_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'role:delete',
        resource: 'role',
        action: 'delete',
        description: 'Delete roles',
        created_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'role:list',
        resource: 'role',
        action: 'list',
        description: 'List all roles',
        created_at: new Date()
      },
      // Permission management permissions
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'permission:read',
        resource: 'permission',
        action: 'read',
        description: 'Read permission information',
        created_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'permission:write',
        resource: 'permission',
        action: 'write',
        description: 'Create or update permissions',
        created_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'permission:delete',
        resource: 'permission',
        action: 'delete',
        description: 'Delete permissions',
        created_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'permission:list',
        resource: 'permission',
        action: 'list',
        description: 'List all permissions',
        created_at: new Date()
      },
      // Audit permissions
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'audit:read',
        resource: 'audit',
        action: 'read',
        description: 'Read audit logs',
        created_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'audit:list',
        resource: 'audit',
        action: 'list',
        description: 'List audit logs',
        created_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'audit:export',
        resource: 'audit',
        action: 'export',
        description: 'Export audit logs',
        created_at: new Date()
      },
      // Profile permissions
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'profile:read',
        resource: 'profile',
        action: 'read',
        description: 'Read own profile',
        created_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'profile:write',
        resource: 'profile',
        action: 'write',
        description: 'Update own profile',
        created_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'profile:read_others',
        resource: 'profile',
        action: 'read_others',
        description: 'Read other user profiles',
        created_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'profile:write_others',
        resource: 'profile',
        action: 'write_others',
        description: 'Update other user profiles',
        created_at: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('user_roles');
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('permissions');
    await queryInterface.dropTable('roles');
  }
};
