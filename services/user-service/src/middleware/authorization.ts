import { Request, Response, NextFunction } from 'express';
import { RBACService } from '../services/rbac';
import { AuditService } from '../services/audit';
import { verifyJwt } from '../utils/auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles?: string[];
  };
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export interface AuthorizationOptions {
  resource: string;
  action: string;
  requireRole?: string;
  logAction?: boolean;
}

export class AuthorizationError extends Error {
  constructor(message: string, public statusCode: number = 403) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class AuthorizationMiddleware {
  constructor(
    private rbacService: RBACService,
    private auditService: AuditService
  ) {}

  /**
   * Middleware to check if user has permission for a specific resource and action
   */
  requirePermission(options: AuthorizationOptions) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AuthorizationError('Authentication required', 401);
        }

        const { resource, action, requireRole, logAction = true } = options;

        // Check if user has required role
        if (requireRole) {
          const hasRole = await this.rbacService.hasRole(req.user.id, requireRole);
          if (!hasRole) {
            await this.logSecurityEvent(req, 'permission_denied', {
              reason: 'Missing required role',
              requiredRole: requireRole,
              resource,
              action
            });
            throw new AuthorizationError(`Access denied: Required role '${requireRole}'`, 403);
          }
        }

        // Check if user has permission for the specific resource and action
        const hasPermission = await this.rbacService.checkPermission(req.user.id, resource, action);
        if (!hasPermission) {
          await this.logSecurityEvent(req, 'permission_denied', {
            reason: 'Insufficient permissions',
            resource,
            action
          });
          throw new AuthorizationError(`Access denied: Insufficient permissions for ${action} on ${resource}`, 403);
        }

        // Log the action if requested
        if (logAction) {
          await this.auditService.logEvent({
            user_id: req.user.id,
            event_type: 'authorization',
            action: `${action}_${resource}`,
            resource_type: resource,
            resource_id: req.params.id,
            details: {
              method: req.method,
              path: req.path,
              params: req.params,
              query: req.query
            },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
          });
        }

        next();
      } catch (error) {
        if (error instanceof AuthorizationError) {
          res.status(error.statusCode).json({
            error: error.message,
            code: 'AUTHORIZATION_ERROR'
          });
        } else {
          next(error);
        }
      }
    };
  }

  /**
   * Middleware to check if user has a specific role
   */
  requireRole(roleName: string) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AuthorizationError('Authentication required', 401);
        }

        const hasRole = await this.rbacService.hasRole(req.user.id, roleName);
        if (!hasRole) {
          await this.logSecurityEvent(req, 'permission_denied', {
            reason: 'Missing required role',
            requiredRole: roleName
          });
          throw new AuthorizationError(`Access denied: Required role '${roleName}'`, 403);
        }

        next();
      } catch (error) {
        if (error instanceof AuthorizationError) {
          res.status(error.statusCode).json({
            error: error.message,
            code: 'AUTHORIZATION_ERROR'
          });
        } else {
          next(error);
        }
      }
    };
  }

  /**
   * Middleware to check if user has any of the specified roles
   */
  requireAnyRole(roleNames: string[]) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AuthorizationError('Authentication required', 401);
        }

        const userRoles = await this.rbacService.getUserRoles(req.user.id);
        const hasAnyRole = userRoles.some(role => roleNames.includes(role.name));

        if (!hasAnyRole) {
          await this.logSecurityEvent(req, 'permission_denied', {
            reason: 'Missing required roles',
            requiredRoles: roleNames,
            userRoles: userRoles.map(r => r.name)
          });
          throw new AuthorizationError(`Access denied: Required one of roles: ${roleNames.join(', ')}`, 403);
        }

        next();
      } catch (error) {
        if (error instanceof AuthorizationError) {
          res.status(error.statusCode).json({
            error: error.message,
            code: 'AUTHORIZATION_ERROR'
          });
        } else {
          next(error);
        }
      }
    };
  }

  /**
   * Middleware to check if user is accessing their own resource or has admin permissions
   */
  requireOwnershipOrPermission(resource: string, action: string) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AuthorizationError('Authentication required', 401);
        }

        const resourceId = req.params.id || req.params.userId;
        
        // Allow if user is accessing their own resource
        if (resourceId === req.user.id) {
          return next();
        }

        // Check if user has permission for the resource and action
        const hasPermission = await this.rbacService.checkPermission(req.user.id, resource, action);
        if (!hasPermission) {
          await this.logSecurityEvent(req, 'permission_denied', {
            reason: 'Accessing other user resource without permission',
            resource,
            action,
            targetUserId: resourceId,
            requestingUserId: req.user.id
          });
          throw new AuthorizationError(`Access denied: Cannot access other user's ${resource}`, 403);
        }

        next();
      } catch (error) {
        if (error instanceof AuthorizationError) {
          res.status(error.statusCode).json({
            error: error.message,
            code: 'AUTHORIZATION_ERROR'
          });
        } else {
          next(error);
        }
      }
    };
  }

  /**
   * Rate limiting middleware based on user roles
   */
  rateLimitByRole(limits: Record<string, { windowMs: number; max: number }>) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return next();
        }

        const userRoles = await this.rbacService.getUserRoles(req.user.id);
        const userRoleNames = userRoles.map(role => role.name);

        // Find the most permissive limit for the user's roles
        let selectedLimit = limits.default || { windowMs: 15 * 60 * 1000, max: 100 };
        
        for (const [roleName, limit] of Object.entries(limits)) {
          if (userRoleNames.includes(roleName)) {
            if (limit.max > selectedLimit.max) {
              selectedLimit = limit;
            }
          }
        }

        // Apply rate limiting logic here
        // This is a simplified version - in production, you'd use a proper rate limiting library
        req.rateLimit = selectedLimit;
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  private async logSecurityEvent(req: AuthenticatedRequest, eventType: string, details: Record<string, any>) {
    try {
      await this.auditService.logEvent({
        user_id: req.user?.id,
        event_type: 'security',
        action: eventType,
        resource_type: 'system',
        details: {
          ...details,
          method: req.method,
          path: req.path,
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    } catch (error) {
      // Don't let audit logging errors break the authorization flow
      console.error('Failed to log security event:', error);
    }
  }
}

export function authenticateJwt(req: Request, res: Response, next: NextFunction) {
  console.log('🔐 authenticateJwt: Starting JWT authentication');
  
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  console.log('🔐 authenticateJwt: Auth header:', authHeader ? 'present' : 'missing');
  
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    console.log('🔐 authenticateJwt: Invalid auth header format');
    res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
    return;
  }
  
  const token = authHeader.replace('Bearer ', '').trim();
  console.log('🔐 authenticateJwt: Token extracted, length:', token.length);
  
  try {
    console.log('🔐 authenticateJwt: Verifying JWT...');
    const decoded = verifyJwt(token);
    console.log('🔐 authenticateJwt: JWT verified, decoded:', { userId: decoded.userId, email: decoded.email });
    
    (req as any).user = {
      id: decoded.userId,
      email: decoded.email,
      roles: decoded.roles || (decoded.role ? [decoded.role] : undefined)
    };
    console.log('🔐 authenticateJwt: req.user set successfully');
    
    next();
    return;
  } catch (err) {
    console.error('🔐 authenticateJwt: JWT verification failed:', err);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }
} 