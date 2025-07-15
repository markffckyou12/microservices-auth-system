import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';

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

describe('User Service Integration Tests', () => {
  let app: express.Application;
  let mockDb: jest.Mocked<Pool>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock database
    mockDb = new Pool() as jest.Mocked<Pool>;
    
    // Create Express app
    app = express();
    app.use(express.json());
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

      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: mockUsers });

      mockDb.query = mockQuery;

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

      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [mockUser] });

      mockDb.query = mockQuery;

      const response = await request(app)
        .get('/users/user-1')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', 'user-1');
      expect(response.body.user).toHaveProperty('email', 'user1@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [] });

      mockDb.query = mockQuery;

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

      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [] }) // Check if user exists
        .mockResolvedValueOnce({ rows: [mockCreatedUser] }); // Create user

      mockDb.query = mockQuery;

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

      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [mockUpdatedUser] });

      mockDb.query = mockQuery;

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
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [] });

      mockDb.query = mockQuery;

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
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'user-1' }] }) // User exists
        .mockResolvedValueOnce({ rowCount: 1 }); // User deleted

      mockDb.query = mockQuery;

      const response = await request(app)
        .delete('/users/user-1')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');
    });

    it('should return 404 for non-existent user', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [] });

      mockDb.query = mockQuery;

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

      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'user-1', 
            password_hash: 'mock-hashed-password' 
          }] 
        }) // Get user
        .mockResolvedValueOnce({ rowCount: 1 }); // Update password

      mockDb.query = mockQuery;

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

      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'user-1', 
            password_hash: 'mock-hashed-password' 
          }] 
        });

      mockDb.query = mockQuery;

      // Mock bcrypt to return false for invalid password
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValueOnce(false);

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
      const mockUser = {
        id: 'user-1',
        email: 'user1@example.com',
        first_name: 'User',
        last_name: 'One',
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [mockUser] });

      mockDb.query = mockQuery;

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
        last_name: 'Profile',
        bio: 'Updated bio'
      };

      const mockUpdatedProfile = {
        id: 'user-1',
        email: 'user1@example.com',
        first_name: 'Updated',
        last_name: 'Profile',
        bio: 'Updated bio',
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [mockUpdatedProfile] });

      mockDb.query = mockQuery;

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