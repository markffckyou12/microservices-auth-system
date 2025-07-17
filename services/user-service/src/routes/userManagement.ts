import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { body, query } from 'express-validator';
import { AuthorizationMiddleware } from '../middleware/authorization';

// Augment Express Request type for user
interface AuthenticatedUser {
  id: string;
  email: string;
  roles?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function setupUserManagementRoutes(db: Pool, authMiddleware?: AuthorizationMiddleware) {
  const router = Router();

  // Simple middleware fallback (for tests)
  const requirePermission = authMiddleware
    ? (options: { resource: string; action: string }) => authMiddleware.requirePermission(options)
    : () => (req: Request, res: Response, next: Function) => next();

  // Get all users (with pagination and filtering)
  router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('status').optional().isIn(['active', 'inactive', 'all']).withMessage('Status must be active, inactive, or all')
  ],
    requirePermission({ resource: 'users', action: 'read' }),
    async (req: Request, res: Response) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search as string;
        const status = req.query.status as string;

        let whereConditions = [];
        let values = [];
        let paramCount = 1;

        // Build WHERE clause
        if (search) {
          whereConditions.push(`(username ILIKE $${paramCount} OR email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`);
          values.push(`%${search}%`);
          paramCount++;
        }

        if (status && status !== 'all') {
          whereConditions.push(`is_active = $${paramCount}`);
          values.push(status === 'active');
          paramCount++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
        const countResult = await db.query(countQuery, values);
        const totalUsers = parseInt(countResult.rows[0].count);

        // Get users with pagination
        values.push(limit, offset);
        const usersQuery = `
          SELECT 
            u.id, u.email, u.username, u.first_name, u.last_name, 
            u.is_active, u.created_at, u.updated_at,
            COALESCE(json_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '[]') as roles
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id
          LEFT JOIN roles r ON ur.role_id = r.id
          ${whereClause}
          GROUP BY u.id
          ORDER BY u.created_at DESC
          LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;

        const usersResult = await db.query(usersQuery, values);
        const users = usersResult.rows.map(user => ({
          ...user,
          roles: user.roles.filter((role: string) => role !== null)
        }));

        return res.json({
          success: true,
          data: {
            users,
            pagination: {
              page,
              limit,
              total: totalUsers,
              totalPages: Math.ceil(totalUsers / limit)
            }
          }
        });
      } catch (error) {
        console.error('Error getting users:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }
  );

  // Get user by ID
  router.get('/:id',
    requirePermission({ resource: 'users', action: 'read' }),
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.id;
        
        const userQuery = `
          SELECT 
            u.id, u.email, u.username, u.first_name, u.last_name, 
            u.is_active, u.created_at, u.updated_at,
            COALESCE(json_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '[]') as roles
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id
          LEFT JOIN roles r ON ur.role_id = r.id
          WHERE u.id = $1
          GROUP BY u.id
        `;

        const userResult = await db.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = {
          ...userResult.rows[0],
          roles: userResult.rows[0].roles.filter((role: string) => role !== null)
        };

        return res.json({ success: true, data: user });
      } catch (error) {
        console.error('Error getting user:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }
  );

  // Create new user
  router.post('/', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
    body('firstName').isLength({ min: 1, max: 50 }).withMessage('First name is required and must be between 1 and 50 characters'),
    body('lastName').isLength({ min: 1, max: 50 }).withMessage('Last name is required and must be between 1 and 50 characters'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('roles').optional().isArray().withMessage('Roles must be an array'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
    requirePermission({ resource: 'users', action: 'create' }),
    async (req: Request, res: Response) => {
      try {
        const { email, username, firstName, lastName, password, roles = [], isActive = true } = req.body;

        // Check if email already exists
        const existingEmail = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingEmail.rows.length > 0) {
          return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        // Check if username already exists
        const existingUsername = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existingUsername.rows.length > 0) {
          return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        // Hash password
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const createUserQuery = `
          INSERT INTO users (email, username, first_name, last_name, password_hash, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, email, username, first_name, last_name, is_active, created_at, updated_at
        `;

        const userResult = await db.query(createUserQuery, [
          email, username, firstName, lastName, hashedPassword, isActive
        ]);

        const newUser = userResult.rows[0];

        // Assign roles if provided
        if (roles.length > 0) {
          for (const roleName of roles) {
            const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', [roleName]);
            if (roleResult.rows.length > 0) {
              await db.query(
                'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3)',
                [newUser.id, roleResult.rows[0].id, req.user?.id || 'system']
              );
            }
          }
        }

        return res.status(201).json({ 
          success: true, 
          message: 'User created successfully',
          data: newUser 
        });
      } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }
  );

  // Update user
  router.put('/:id', [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('username').optional().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
    body('firstName').optional().isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters'),
    body('lastName').optional().isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
    requirePermission({ resource: 'users', action: 'update' }),
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.id;
        const { email, username, firstName, lastName, isActive } = req.body;

        // Check if user exists
        const existingUser = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (existingUser.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check for email conflicts
        if (email) {
          const emailConflict = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
          if (emailConflict.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
          }
        }

        // Check for username conflicts
        if (username) {
          const usernameConflict = await db.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
          if (usernameConflict.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
          }
        }

        // Build update query
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        if (email) {
          updateFields.push(`email = $${paramCount}`);
          values.push(email);
          paramCount++;
        }
        if (username) {
          updateFields.push(`username = $${paramCount}`);
          values.push(username);
          paramCount++;
        }
        if (firstName) {
          updateFields.push(`first_name = $${paramCount}`);
          values.push(firstName);
          paramCount++;
        }
        if (lastName) {
          updateFields.push(`last_name = $${paramCount}`);
          values.push(lastName);
          paramCount++;
        }
        if (typeof isActive === 'boolean') {
          updateFields.push(`is_active = $${paramCount}`);
          values.push(isActive);
          paramCount++;
        }

        if (updateFields.length === 0) {
          return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(userId);
        const updateQuery = `
          UPDATE users 
          SET ${updateFields.join(', ')}, updated_at = NOW() 
          WHERE id = $${paramCount}
          RETURNING id, email, username, first_name, last_name, is_active, created_at, updated_at
        `;

        const result = await db.query(updateQuery, values);
        const updatedUser = result.rows[0];

        return res.json({ 
          success: true, 
          message: 'User updated successfully',
          data: updatedUser 
        });
      } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }
  );

  // Delete user (soft delete)
  router.delete('/:id',
    requirePermission({ resource: 'users', action: 'delete' }),
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.id;

        // Check if user exists
        const existingUser = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (existingUser.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Soft delete by setting is_active to false
        await db.query('UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1', [userId]);

        return res.json({ 
          success: true, 
          message: 'User deleted successfully' 
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }
  );

  return router;
}

export default setupUserManagementRoutes; 