import { Router, Request, Response } from 'express';
import { RBACService } from '../services/rbac';
import { AuthenticatedRequest } from '../middleware/authorization';

export function setupRBACRoutes(rbacService: RBACService) {
  const router = Router();

  // Validation middleware
  const validateRequest = (req: Request, res: Response, next: Function) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required'
      });
    }
    return next();
  };

  // Create a new role
  router.post('/roles', validateRequest, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description, parent_role_id } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Role name is required'
        });
      }

      const role = await rbacService.createRole({
        name,
        description,
        parent_role_id
      });

      return res.status(201).json({
        success: true,
        data: role
      });
    } catch (error) {
      console.error('Error creating role:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create role'
      });
    }
  });

  // Get all roles
  router.get('/roles', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const roles = await rbacService.getAllRoles();
      
      return res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch roles'
      });
    }
  });

  // Get role by ID
  router.get('/roles/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const role = await rbacService.getRoleById(id);
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      return res.json({
        success: true,
        data: role
      });
    } catch (error) {
      console.error('Error fetching role:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch role'
      });
    }
  });

  // Get role with permissions (including inherited)
  router.get('/roles/:id/permissions', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const roleWithPermissions = await rbacService.getRoleWithPermissions(id);
      
      if (!roleWithPermissions) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      return res.json({
        success: true,
        data: roleWithPermissions
      });
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch role permissions'
      });
    }
  });

  // Get role hierarchy
  router.get('/roles/:id/hierarchy', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const hierarchy = await rbacService.getRoleHierarchy(id);
      
      return res.json({
        success: true,
        data: hierarchy
      });
    } catch (error) {
      console.error('Error fetching role hierarchy:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch role hierarchy'
      });
    }
  });

  // Update role
  router.put('/roles/:id', validateRequest, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, parent_role_id } = req.body;
      
      const role = await rbacService.updateRole(id, {
        name,
        description,
        parent_role_id
      });

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      return res.json({
        success: true,
        data: role
      });
    } catch (error) {
      console.error('Error updating role:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update role'
      });
    }
  });

  // Delete role
  router.delete('/roles/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await rbacService.deleteRole(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      return res.json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete role'
      });
    }
  });

  // Create a new permission
  router.post('/permissions', validateRequest, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, resource, action, description } = req.body;
      
      if (!name || !resource || !action) {
        return res.status(400).json({
          success: false,
          message: 'Permission name, resource, and action are required'
        });
      }

      const permission = await rbacService.createPermission({
        name,
        resource,
        action,
        description
      });

      return res.status(201).json({
        success: true,
        data: permission
      });
    } catch (error) {
      console.error('Error creating permission:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create permission'
      });
    }
  });

  // Get all permissions
  router.get('/permissions', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const permissions = await rbacService.getAllPermissions();
      
      return res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch permissions'
      });
    }
  });

  // Get permission by ID
  router.get('/permissions/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const permission = await rbacService.getPermission(id);
      
      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Permission not found'
        });
      }

      return res.json({
        success: true,
        data: permission
      });
    } catch (error) {
      console.error('Error fetching permission:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch permission'
      });
    }
  });

  // Add permission to role
  router.post('/roles/:roleId/permissions/:permissionId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { roleId, permissionId } = req.params;
      const success = await rbacService.addPermissionToRole(roleId, permissionId);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to add permission to role'
        });
      }

      return res.json({
        success: true,
        message: 'Permission added to role successfully'
      });
    } catch (error) {
      console.error('Error adding permission to role:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add permission to role'
      });
    }
  });

  // Remove permission from role
  router.delete('/roles/:roleId/permissions/:permissionId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { roleId, permissionId } = req.params;
      const success = await rbacService.removePermissionFromRole(roleId, permissionId);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to remove permission from role'
        });
      }

      return res.json({
        success: true,
        message: 'Permission removed from role successfully'
      });
    } catch (error) {
      console.error('Error removing permission from role:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove permission from role'
      });
    }
  });

  // Assign role to user
  router.post('/users/:userId/roles/:roleId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, roleId } = req.params;
      const assignedBy = req.user?.id;
      
      const userRole = await rbacService.assignRoleToUser(userId, roleId, assignedBy);

      return res.status(201).json({
        success: true,
        data: userRole
      });
    } catch (error) {
      console.error('Error assigning role to user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to assign role to user'
      });
    }
  });

  // Get user roles
  router.get('/users/:userId/roles', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const roles = await rbacService.getUserRoles(userId);
      
      return res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user roles'
      });
    }
  });

  // Get user permissions (including inherited)
  router.get('/users/:userId/permissions', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const permissions = await rbacService.getUserPermissions(userId);
      
      return res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user permissions'
      });
    }
  });

  // Remove role from user
  router.delete('/users/:userId/roles/:roleId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, roleId } = req.params;
      const success = await rbacService.removeRoleFromUser(userId, roleId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'User role not found'
        });
      }

      return res.json({
        success: true,
        message: 'Role removed from user successfully'
      });
    } catch (error) {
      console.error('Error removing role from user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove role from user'
      });
    }
  });

  // Check if user has role
  router.get('/users/:userId/roles/:roleName/check', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, roleName } = req.params;
      const hasRole = await rbacService.hasRole(userId, roleName);
      
      return res.json({
        success: true,
        data: { hasRole }
      });
    } catch (error) {
      console.error('Error checking user role:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check user role'
      });
    }
  });

  // Check if user has permission
  router.get('/users/:userId/permissions/:resource/:action/check', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, resource, action } = req.params;
      const hasPermission = await rbacService.checkPermission(userId, resource, action);
      
      return res.json({
        success: true,
        data: { hasPermission }
      });
    } catch (error) {
      console.error('Error checking user permission:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check user permission'
      });
    }
  });

  return router;
}

// Export for backward compatibility
export const createRBACRouter = setupRBACRoutes; 