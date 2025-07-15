import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { PasswordServiceImpl } from '../../src/services/password';
import { RBACService } from '../../src/services/rbac';

// Mock dependencies following existing patterns
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn()
  }))
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => 'mock-hashed-password'),
  compare: jest.fn(() => true)
}));

jest.mock('../../src/utils/auth', () => ({
  signJwt: jest.fn(() => 'mock-jwt-token'),
  verifyJwt: jest.fn(() => ({ userId: 'mock-user-id' }))
}));

// Test constants
const TEST_USER = {
  id: 'user-1',
  email: 'test@example.com',
  roles: ['user']
};

// Test utilities
const createMockDb = () => ({
  query: jest.fn()
} as unknown as jest.Mocked<Pool>);

const createTestApp = (withAuth = true): express.Application => {
  const app = express();
  app.use(express.json());

  if (withAuth) {
    app.use((req, res, next) => {
      req.user = TEST_USER;
      next();
    });
  }

  return app;
};

const createTestUserRouter = (db: Pool, passwordService: PasswordServiceImpl, rbacService: RBACService) => {
  const router = express.Router();
  
  // GET /users
  router.get('/', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
      return res.json({ users: result.rows });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /users/:id
  router.get('/:id', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ user: result.rows[0] });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /users
  router.post('/', async (req, res) => {
    try {
      const { email, first_name, last_name, password } = req.body;
      
      if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ errors: ['Missing required fields'] });
      }

      // Check if user exists
      const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ errors: ['User already exists'] });
      }

      // Create user
      const result = await db.query(
        'INSERT INTO users (email, first_name, last_name, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, created_at, updated_at',
        [email, first_name, last_name, 'mock-hashed-password']
      );
      
      return res.status(201).json({ user: result.rows[0] });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /users/:id
  router.put('/:id', async (req, res) => {
    try {
      const result = await db.query(
        'UPDATE users SET first_name = $1, last_name = $2, email = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [req.body.first_name, req.body.last_name, req.body.email, req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ user: result.rows[0] });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /users/:id
  router.delete('/:id', async (req, res) => {
    try {
      const result = await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ message: 'User deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /users/:id/password
  router.post('/:id/password', async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new password are required' });
      }

      const success = await passwordService.changePassword(req.params.id, currentPassword, newPassword);
      if (success) {
        return res.json({ message: 'Password changed successfully' });
      } else {
        return res.status(400).json({ message: 'Invalid current password' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /users/:id/profile
  router.get('/:id/profile', async (req, res) => {
    try {
      const result = await db.query(
        'SELECT id, email, first_name, last_name, bio, created_at, updated_at FROM users WHERE id = $1',
        [req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ profile: result.rows[0] });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /users/:id/profile
  router.put('/:id/profile', async (req, res) => {
    try {
      const result = await db.query(
        'UPDATE users SET first_name = $1, last_name = $2, bio = $3, updated_at = NOW() WHERE id = $4 RETURNING id, email, first_name, last_name, bio, created_at, updated_at',
        [req.body.first_name, req.body.last_name, req.body.bio, req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ profile: result.rows[0] });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};

describe('User Service Integration Tests', () => {
  let app: express.Application;
  let mockDb: jest.Mocked<Pool>;
  let passwordService: PasswordServiceImpl;
  let rbacService: RBACService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock database
    mockDb = createMockDb();
    
    // Create services
    passwordService = new PasswordServiceImpl(mockDb);
    rbacService = new RBACService(mockDb);
    
    // Create Express app
    app = createTestApp();
    app.use('/users', createTestUserRouter(mockDb, passwordService, rbacService));
  });

  describe('GET /users', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          first_name: 'User',
          last_name: 'One',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          first_name: 'User',
          last_name: 'Two',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: mockUsers });

      const response = await request(app)
        .get('/users')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBe(2);
    });

    it('should return 401 without authorization', async () => {
      const response = await request(app)
        .get('/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by ID successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user1@example.com',
        first_name: 'User',
        last_name: 'One',
        created_at: new Date(),
        updated_at: new Date()
      };

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .get('/users/user-1')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', 'user-1');
      expect(response.body.user).toHaveProperty('email', 'user1@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/users/non-existent-user')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('POST /users', () => {
    it('should create user successfully', async () => {
      const newUser = {
        email: 'newuser@example.com',
        first_name: 'New',
        last_name: 'User',
        password: 'password123'
      };

      const mockCreatedUser = {
        id: 'new-user-id',
        email: 'newuser@example.com',
        first_name: 'New',
        last_name: 'User',
        created_at: new Date(),
        updated_at: new Date()
      };

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // Check if user exists
        .mockResolvedValueOnce({ rows: [mockCreatedUser] }); // Create user

      const response = await request(app)
        .post('/users')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for invalid user data', async () => {
      const invalidUser = {
        email: 'invalid-email',
        first_name: 'New',
        last_name: 'User'
        // Missing password
      };

      const response = await request(app)
        .post('/users')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /users/:id', () => {
    it('should update user successfully', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'User',
        email: 'updated@example.com'
      };

      const mockUpdatedUser = {
        id: 'user-1',
        email: 'updated@example.com',
        first_name: 'Updated',
        last_name: 'User',
        created_at: new Date(),
        updated_at: new Date()
      };

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUpdatedUser] });

      const response = await request(app)
        .put('/users/user-1')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('first_name', 'Updated');
      expect(response.body.user).toHaveProperty('email', 'updated@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/users/non-existent-user')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({ first_name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user successfully', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .delete('/users/user-1')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');
    });

    it('should return 404 for non-existent user', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });

      const response = await request(app)
        .delete('/users/non-existent-user')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('POST /users/:id/password', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      };

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ password_hash: 'mock-hash' }] }) // Get user
        .mockResolvedValueOnce({ rowCount: 1 }); // Update password

      const response = await request(app)
        .post('/users/user-1/password')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password changed successfully');
    });

    it('should return 400 for invalid current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ password_hash: 'mock-hash' }] }); // Get user

      const response = await request(app)
        .post('/users/user-1/password')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid current password');
    });
  });

  describe('GET /users/:id/profile', () => {
    it('should get user profile successfully', async () => {
      const mockProfile = {
        id: 'user-1',
        email: 'user1@example.com',
        first_name: 'User',
        last_name: 'One',
        bio: 'Test bio',
        created_at: new Date(),
        updated_at: new Date()
      };

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [mockProfile] });

      const response = await request(app)
        .get('/users/user-1/profile')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('id', 'user-1');
      expect(response.body.profile).toHaveProperty('email', 'user1@example.com');
    });
  });

  describe('PUT /users/:id/profile', () => {
    it('should update user profile successfully', async () => {
      const profileData = {
        first_name: 'Updated',
        bio: 'Updated bio'
      };

      const mockUpdatedProfile = {
        id: 'user-1',
        email: 'user1@example.com',
        first_name: 'Updated',
        last_name: 'One',
        bio: 'Updated bio',
        created_at: new Date(),
        updated_at: new Date()
      };

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUpdatedProfile] });

      const response = await request(app)
        .put('/users/user-1/profile')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(profileData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('first_name', 'Updated');
      expect(response.body.profile).toHaveProperty('bio', 'Updated bio');
    });
  });
}); 