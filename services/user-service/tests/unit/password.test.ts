import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { PasswordServiceImpl } from '../../src/services/password';
import createPasswordRouter from '../../src/routes/password';

// Mock bcrypt at the module level
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$mockedhash'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock the database with proper typing
const mockDb = {
  query: jest.fn()
} as unknown as jest.Mocked<Pool>;

// Create test app
const app = express();
app.use(express.json());

// Mock authentication middleware
app.use((req, res, next) => {
  req.user = {
    id: 'user-1',
    email: 'test@example.com',
    roles: ['user']
  };
  next();
});

app.use('/auth/password', createPasswordRouter(new PasswordServiceImpl(mockDb)));

describe('Password Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset bcrypt mocks
    const bcrypt = require('bcryptjs');
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$mockedhash');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('POST /auth/password/reset-request', () => {
    it('should request password reset for existing user', async () => {
      // Mock database response for existing user
      (mockDb.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'user-id' }]
      });

      // Mock successful token generation and email sending
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .post('/auth/password/reset-request')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not reveal if user exists or not', async () => {
      // Mock database response for non-existing user
      (mockDb.query as jest.Mock).mockResolvedValueOnce({
        rows: []
      });

      const response = await request(app)
        .post('/auth/password/reset-request')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/auth/password/reset-request')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email is required');
    });
  });

  describe('POST /auth/password/reset', () => {
    it('should reset password with valid token', async () => {
      // Mock valid token
      (mockDb.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          user_id: 'user-id',
          expires_at: new Date(Date.now() + 3600000), // 1 hour from now
          used: false
        }]
      });

      // Mock password update
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .post('/auth/password/reset')
        .send({
          token: 'valid-token',
          newPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 if token is missing', async () => {
      const response = await request(app)
        .post('/auth/password/reset')
        .send({ newPassword: 'NewPassword123!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Token is required');
    });

    it('should return 400 if new password is missing', async () => {
      const response = await request(app)
        .post('/auth/password/reset')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('New password is required');
    });

    it('should return 400 for invalid or expired token', async () => {
      // Mock invalid token
      (mockDb.query as jest.Mock).mockResolvedValueOnce({
        rows: []
      });

      const response = await request(app)
        .post('/auth/password/reset')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  describe('POST /auth/password/change', () => {
    it('should change password for authenticated user', async () => {
      // Mock the database calls in the exact order they happen:
      // 1. Get current password hash
      (mockDb.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ password: '$2a$12$mockedhash' }]
      });

      // 2. Check password history (empty result - no reused passwords)
      (mockDb.query as jest.Mock).mockResolvedValueOnce({
        rows: []
      });

      // 3. Update user password
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

      // 4. Insert into password history
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .post('/auth/password/change')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 if current password is missing', async () => {
      const response = await request(app)
        .post('/auth/password/change')
        .send({ newPassword: 'NewPassword123!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Current password is required');
    });

    it('should return 400 if new password is missing', async () => {
      const response = await request(app)
        .post('/auth/password/change')
        .send({ currentPassword: 'OldPassword123!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('New password is required');
    });

    it('should return 400 if current password is incorrect', async () => {
      // Mock bcrypt.compare to return false (incorrect password)
      const bcrypt = require('bcryptjs');
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      // Mock database call to get current password
      (mockDb.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ password: '$2a$12$mockedhash' }]
      });

      const response = await request(app)
        .post('/auth/password/change')
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Current password is incorrect');
    });

    it('should return 400 if user is not authenticated', async () => {
      // Create app without authentication middleware
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.use('/auth/password', createPasswordRouter(new PasswordServiceImpl(mockDb)));

      const response = await request(appWithoutAuth)
        .post('/auth/password/change')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });
  });
});

describe('Password Service', () => {
  let passwordService: PasswordServiceImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    passwordService = new PasswordServiceImpl(mockDb);
    
    // Reset bcrypt mocks
    const bcrypt = require('bcryptjs');
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$mockedhash');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('should generate password reset token', async () => {
    const token = await passwordService.generatePasswordResetToken('user-id');
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should validate password strength', () => {
    const strongPassword = passwordService.validatePasswordStrength('StrongPassword123!');
    const weakPassword = passwordService.validatePasswordStrength('weak');
    
    expect(strongPassword.isValid).toBe(true);
    expect(weakPassword.isValid).toBe(false);
  });

  it('should check password history', async () => {
    // Mock password history
    (mockDb.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { password_hash: '$2a$12$oldhash1' },
        { password_hash: '$2a$12$oldhash2' }
      ]
    });

    const result = await passwordService.checkPasswordHistory('user-id', 'NewPassword123!');
    
    expect(typeof result).toBe('boolean');
  });

  it('should send password reset email', async () => {
    // Mock console.log to capture the output
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await passwordService.sendPasswordResetEmail('test@example.com', 'reset-token');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Password reset email sent to test@example.com with token: reset-token'
    );

    consoleSpy.mockRestore();
  });

  it('should validate NewPassword123! correctly', () => {
    const validation = passwordService.validatePasswordStrength('NewPassword123!');
    expect(validation.isValid).toBe(true);
  });

  it('should change password successfully', async () => {
    // Mock database calls
    (mockDb.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ password: '$2a$12$mockedhash' }]
    });

    (mockDb.query as jest.Mock).mockResolvedValueOnce({
      rows: []
    });

    (mockDb.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });
    (mockDb.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

    const result = await passwordService.changePassword('user-1', 'OldPassword123!', 'NewPassword123!');
    
    expect(result).toBe(true);
  });

  it('should return false if current password is incorrect', async () => {
    // Mock bcrypt.compare to return false (incorrect password)
    const bcrypt = require('bcryptjs');
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

    // Mock database call to get current password
    (mockDb.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ password: '$2a$12$mockedhash' }]
    });

    const result = await passwordService.changePassword('user-1', 'WrongPassword123!', 'NewPassword123!');
    
    expect(result).toBe(false);
  });

  it('should return false if user not found', async () => {
    // Mock database call to return no user
    (mockDb.query as jest.Mock).mockResolvedValueOnce({
      rows: []
    });

    const result = await passwordService.changePassword('nonexistent-user', 'OldPassword123!', 'NewPassword123!');
    
    expect(result).toBe(false);
  });

  it('should return false if password validation fails', async () => {
    // Mock database call to get current password
    (mockDb.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ password: '$2a$12$mockedhash' }]
    });

    const result = await passwordService.changePassword('user-1', 'OldPassword123!', 'weak');
    
    expect(result).toBe(false);
  });

  it('should return false if password is reused', async () => {
    // Mock database call to get current password
    (mockDb.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ password: '$2a$12$mockedhash' }]
    });

    // Mock password history to return reused password
    (mockDb.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ password_hash: '$2a$12$reusedhash' }]
    });

    // Mock bcrypt.compare to return true for reused password
    const bcrypt = require('bcryptjs');
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true); // Current password
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true); // Reused password

    const result = await passwordService.changePassword('user-1', 'OldPassword123!', 'ReusedPassword123!');
    
    expect(result).toBe(false);
  });
});