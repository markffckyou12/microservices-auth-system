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
    next();
  };

  // Create a new role
  router.post('/roles', validateRequest, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description, permissions } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Role name is required'
        });
      }

      const role = await rbacService.createRole({
        name,
        description,
        permissions: permissions || []
      });

      res.status(201).json({
        success: true,
        data: role
      });
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create role'
      });
    }
  });

  // Get all roles
  router.get('/roles', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const roles = await rbacService.getAllRoles();
      
      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({
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

      res.json({
        success: true,
        data: role
      });
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch role'
      });
    }
  });

  // Update role
  router.put('/roles/:id', validateRequest, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, permissions } = req.body;
      
      const role = await rbacService.updateRole(id, {
        name,
        description,
        permissions: permissions || []
      });

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      res.json({
        success: true,
        data: role
      });
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({
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

      res.json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({
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

      res.status(201).json({
        success: true,
        data: permission
      });
    } catch (error) {
      console.error('Error creating permission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create permission'
      });
    }
  });

  // Get all permissions
  router.get('/permissions', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const permissions = await rbacService.getAllPermissions();
      
      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch permissions'
      });
    }
  });

  // Assign role to user
  router.post('/users/:userId/roles/:roleId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, roleId } = req.params;
      const assignedBy = req.user?.id || 'system';
      
      const userRole = await rbacService.assignRoleToUser(userId, roleId, assignedBy);
      
      res.status(201).json({
        success: true,
        data: userRole
      });
    } catch (error) {
      console.error('Error assigning role to user:', error);
      res.status(500).json({
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
      
      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error('Error fetching user roles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user roles'
      });
    }
  });

  // Remove role from user
  router.delete('/users/:userId/roles/:roleId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, roleId } = req.params;
      const removed = await rbacService.removeRoleFromUser(userId, roleId);
      
      if (!removed) {
        return res.status(404).json({
          success: false,
          message: 'User role assignment not found'
        });
      }

      res.json({
        success: true,
        message: 'Role removed from user successfully'
      });
    } catch (error) {
      console.error('Error removing role from user:', error);
      res.status(500).json({
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
      
      res.json({
        success: true,
        data: { hasRole }
      });
    } catch (error) {
      console.error('Error checking user role:', error);
      res.status(500).json({
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
      
      res.json({
        success: true,
        data: { hasPermission }
      });
    } catch (error) {
      console.error('Error checking user permission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check user permission'
      });
    }
  });

  return router;
} 