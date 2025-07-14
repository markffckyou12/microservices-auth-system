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

// Mock express-validator
jest.mock('express-validator', () => ({
  body: jest.fn(() => ({
    isEmail: jest.fn(() => ({
      withMessage: jest.fn(() => [])
    })),
    notEmpty: jest.fn(() => ({
      withMessage: jest.fn(() => [])
    })),
    isLength: jest.fn(() => ({
      withMessage: jest.fn(() => [])
    }))
  }))
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
    });

    it('should return 400 if new password is missing', async () => {
      const response = await request(app)
        .post('/auth/password/reset')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(400);
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

      // Add debugging to see what's happening
      console.log('Response status:', response.status);
      console.log('Response body:', response.body);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 if current password is missing', async () => {
      const response = await request(app)
        .post('/auth/password/change')
        .send({ newPassword: 'NewPassword123!' });

      expect(response.status).toBe(400);
    });

    it('should return 400 if new password is missing', async () => {
      const response = await request(app)
        .post('/auth/password/change')
        .send({ currentPassword: 'OldPassword123!' });

      expect(response.status).toBe(400);
    });
  });
});

describe('Password Service', () => {
  let passwordService: PasswordServiceImpl;

  beforeEach(() => {
    passwordService = new PasswordServiceImpl(mockDb);
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

  // Test password validation specifically
  it('should validate NewPassword123! correctly', () => {
    const validation = passwordService.validatePasswordStrength('NewPassword123!');
    expect(validation.isValid).toBe(true);
  });

  // Test the changePassword method step by step with detailed debugging
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

    try {
      console.log('Starting password change test...');
      console.log('Mock calls before:', (mockDb.query as jest.Mock).mock.calls);
      
      const result = await passwordService.changePassword('user-1', 'OldPassword123!', 'NewPassword123!');
      
      console.log('Password change result:', result);
      console.log('Mock calls after:', (mockDb.query as jest.Mock).mock.calls);
      
      expect(result).toBe(true);
    } catch (error) {
      console.error('Password change error:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  });
});