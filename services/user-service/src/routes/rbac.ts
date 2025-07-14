import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { RBACService } from '../services/rbac';
import { AuthorizationMiddleware } from '../middleware/authorization';
import { AuthenticatedRequest } from '../middleware/authorization';

export function createRBACRouter(rbacService: RBACService, authMiddleware: AuthorizationMiddleware) {
  const router = Router();

  // Validation middleware
  const validateRequest = (req: Request, res: Response, next: Function) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    next();
  };

  // Role Management Routes
  router.post('/roles',
    [
      body('name').isString().trim().isLength({ min: 1, max: 50 }),
      body('description').isString().trim().isLength({ min: 1, max: 500 }),
      body('permissions').isArray().withMessage('Permissions must be an array')
    ],
    validateRequest,
    authMiddleware.requirePermission({ resource: 'roles', action: 'create' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const role = await rbacService.createRole({
          name: req.body.name,
          description: req.body.description,
          permissions: req.body.permissions
        });

        res.status(201).json({
          message: 'Role created successfully',
          role
        });
      } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ error: 'Failed to create role' });
      }
    }
  );

  router.get('/roles',
    authMiddleware.requirePermission({ resource: 'roles', action: 'read' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const roles = await rbacService.listRoles();
        res.json({ roles });
      } catch (error) {
        console.error('Error listing roles:', error);
        res.status(500).json({ error: 'Failed to list roles' });
      }
    }
  );

  router.get('/roles/:roleId',
    [
      param('roleId').isUUID().withMessage('Invalid role ID')
    ],
    validateRequest,
    authMiddleware.requirePermission({ resource: 'roles', action: 'read' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const role = await rbacService.getRole(req.params.roleId);
        
        if (!role) {
          return res.status(404).json({ error: 'Role not found' });
        }

        res.json({ role });
      } catch (error) {
        console.error('Error getting role:', error);
        res.status(500).json({ error: 'Failed to get role' });
      }
    }
  );

  router.put('/roles/:roleId',
    [
      param('roleId').isUUID().withMessage('Invalid role ID'),
      body('name').optional().isString().trim().isLength({ min: 1, max: 50 }),
      body('description').optional().isString().trim().isLength({ min: 1, max: 500 }),
      body('permissions').optional().isArray().withMessage('Permissions must be an array')
    ],
    validateRequest,
    authMiddleware.requirePermission({ resource: 'roles', action: 'update' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const role = await rbacService.updateRole(req.params.roleId, req.body);
        
        if (!role) {
          return res.status(404).json({ error: 'Role not found' });
        }

        res.json({
          message: 'Role updated successfully',
          role
        });
      } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ error: 'Failed to update role' });
      }
    }
  );

  router.delete('/roles/:roleId',
    [
      param('roleId').isUUID().withMessage('Invalid role ID')
    ],
    validateRequest,
    authMiddleware.requirePermission({ resource: 'roles', action: 'delete' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const deleted = await rbacService.deleteRole(req.params.roleId);
        
        if (!deleted) {
          return res.status(404).json({ error: 'Role not found' });
        }

        res.json({ message: 'Role deleted successfully' });
      } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ error: 'Failed to delete role' });
      }
    }
  );

  // Permission Management Routes
  router.post('/permissions',
    [
      body('name').isString().trim().isLength({ min: 1, max: 100 }),
      body('resource').isString().trim().isLength({ min: 1, max: 50 }),
      body('action').isString().trim().isLength({ min: 1, max: 50 }),
      body('description').isString().trim().isLength({ min: 1, max: 500 })
    ],
    validateRequest,
    authMiddleware.requirePermission({ resource: 'permissions', action: 'create' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const permission = await rbacService.createPermission({
          name: req.body.name,
          resource: req.body.resource,
          action: req.body.action,
          description: req.body.description
        });

        res.status(201).json({
          message: 'Permission created successfully',
          permission
        });
      } catch (error) {
        console.error('Error creating permission:', error);
        res.status(500).json({ error: 'Failed to create permission' });
      }
    }
  );

  router.get('/permissions',
    authMiddleware.requirePermission({ resource: 'permissions', action: 'read' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const permissions = await rbacService.listPermissions();
        res.json({ permissions });
      } catch (error) {
        console.error('Error listing permissions:', error);
        res.status(500).json({ error: 'Failed to list permissions' });
      }
    }
  );

  router.get('/permissions/:permissionId',
    [
      param('permissionId').isUUID().withMessage('Invalid permission ID')
    ],
    validateRequest,
    authMiddleware.requirePermission({ resource: 'permissions', action: 'read' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const permission = await rbacService.getPermission(req.params.permissionId);
        
        if (!permission) {
          return res.status(404).json({ error: 'Permission not found' });
        }

        res.json({ permission });
      } catch (error) {
        console.error('Error getting permission:', error);
        res.status(500).json({ error: 'Failed to get permission' });
      }
    }
  );

  // User Role Assignment Routes
  router.post('/users/:userId/roles',
    [
      param('userId').isUUID().withMessage('Invalid user ID'),
      body('roleId').isUUID().withMessage('Invalid role ID')
    ],
    validateRequest,
    authMiddleware.requirePermission({ resource: 'user_roles', action: 'create' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userRole = await rbacService.assignRoleToUser(
          req.params.userId,
          req.body.roleId,
          req.user!.id
        );

        res.status(201).json({
          message: 'Role assigned successfully',
          userRole
        });
      } catch (error) {
        console.error('Error assigning role:', error);
        res.status(500).json({ error: 'Failed to assign role' });
      }
    }
  );

  router.delete('/users/:userId/roles/:roleId',
    [
      param('userId').isUUID().withMessage('Invalid user ID'),
      param('roleId').isUUID().withMessage('Invalid role ID')
    ],
    validateRequest,
    authMiddleware.requirePermission({ resource: 'user_roles', action: 'delete' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const revoked = await rbacService.revokeRoleFromUser(
          req.params.userId,
          req.params.roleId
        );

        if (!revoked) {
          return res.status(404).json({ error: 'User role not found' });
        }

        res.json({ message: 'Role revoked successfully' });
      } catch (error) {
        console.error('Error revoking role:', error);
        res.status(500).json({ error: 'Failed to revoke role' });
      }
    }
  );

  router.get('/users/:userId/roles',
    [
      param('userId').isUUID().withMessage('Invalid user ID')
    ],
    validateRequest,
    authMiddleware.requireOwnershipOrPermission('user_roles', 'read'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const roles = await rbacService.getUserRoles(req.params.userId);
        res.json({ roles });
      } catch (error) {
        console.error('Error getting user roles:', error);
        res.status(500).json({ error: 'Failed to get user roles' });
      }
    }
  );

  router.get('/users/:userId/permissions',
    [
      param('userId').isUUID().withMessage('Invalid user ID')
    ],
    validateRequest,
    authMiddleware.requireOwnershipOrPermission('user_permissions', 'read'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const permissions = await rbacService.getUserPermissions(req.params.userId);
        res.json({ permissions });
      } catch (error) {
        console.error('Error getting user permissions:', error);
        res.status(500).json({ error: 'Failed to get user permissions' });
      }
    }
  );

  // Permission Check Route
  router.post('/check-permission',
    [
      body('userId').isUUID().withMessage('Invalid user ID'),
      body('resource').isString().trim().isLength({ min: 1 }),
      body('action').isString().trim().isLength({ min: 1 })
    ],
    validateRequest,
    authMiddleware.requirePermission({ resource: 'permissions', action: 'read' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const hasPermission = await rbacService.checkPermission(
          req.body.userId,
          req.body.resource,
          req.body.action
        );

        res.json({
          hasPermission,
          userId: req.body.userId,
          resource: req.body.resource,
          action: req.body.action
        });
      } catch (error) {
        console.error('Error checking permission:', error);
        res.status(500).json({ error: 'Failed to check permission' });
      }
    }
  );

  return router;
} 