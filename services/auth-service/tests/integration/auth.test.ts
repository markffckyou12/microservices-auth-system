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

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ userId: 'mock-user-id' }))
}));

jest.mock('../../src/utils/auth', () => ({
  signJwt: jest.fn(() => 'mock-jwt-token'),
  verifyJwt: jest.fn(() => ({ userId: 'mock-user-id' }))
}));

describe('Auth Service Integration Tests', () => {
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

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock database responses
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [] }) // Check if user exists
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'new-user-id', 
            email: 'test@example.com', 
            first_name: 'Test',
            last_name: 'User',
            created_at: new Date()
          }] 
        }); // User created

      mockDb.query = mockQuery;

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 409 for duplicate email', async () => {
      // Mock database to return existing user
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ 
          rows: [{ id: 'existing-user-id', email: 'duplicate@example.com' }] 
        }); // User already exists

      mockDb.query = mockQuery;

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message', 'User already exists');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(() => {
      // Mock database for existing user
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'login-user-id', 
            email: 'login@example.com',
            password_hash: 'mock-hashed-password',
            first_name: 'Login',
            last_name: 'User'
          }] 
        }); // Existing user

      mockDb.query = mockQuery;
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'login@example.com');
    });

    it('should return 401 for invalid password', async () => {
      // Mock bcrypt to return false for invalid password
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValueOnce(false);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 404 for non-existent user', async () => {
      // Mock database to return no user
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [] }); // No user found

      mockDb.query = mockQuery;

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('POST /auth/oauth/google', () => {
    it('should return OAuth URL for Google', async () => {
      const response = await request(app)
        .post('/auth/oauth/google')
        .send({
          redirectUri: 'http://localhost:3000/callback'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authUrl');
      expect(response.body.authUrl).toContain('accounts.google.com');
    });
  });

  describe('POST /auth/oauth/github', () => {
    it('should return OAuth URL for GitHub', async () => {
      const response = await request(app)
        .post('/auth/oauth/github')
        .send({
          redirectUri: 'http://localhost:3000/callback'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authUrl');
      expect(response.body.authUrl).toContain('github.com');
    });
  });

  describe('POST /auth/mfa/setup', () => {
    beforeEach(() => {
      // Mock JWT verification for authenticated user
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ userId: 'mfa-user-id' });
    });

    it('should setup MFA successfully', async () => {
      const response = await request(app)
        .post('/auth/mfa/setup')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('secret');
      expect(response.body).toHaveProperty('qrCode');
      expect(response.body).toHaveProperty('backupCodes');
      expect(response.body.backupCodes).toHaveLength(10);
    });

    it('should return 401 without valid token', async () => {
      const response = await request(app)
        .post('/auth/mfa/setup');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/mfa/verify', () => {
    beforeEach(() => {
      // Mock JWT verification for authenticated user
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ userId: 'mfaverify-user-id' });
    });

    it('should verify MFA with valid token', async () => {
      const response = await request(app)
        .post('/auth/mfa/verify')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({
          token: '123456' // Mock token
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'MFA verified successfully');
    });

    it('should return 400 for invalid token', async () => {
      const response = await request(app)
        .post('/auth/mfa/verify')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({
          token: '000000'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid MFA token');
    });
  });

  describe('POST /auth/refresh', () => {
    beforeEach(() => {
      // Mock JWT verification for authenticated user
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ userId: 'refresh-user-id' });
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).not.toBe('mock-jwt-token');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    beforeEach(() => {
      // Mock JWT verification for authenticated user
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ userId: 'logout-user-id' });
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });
}); 