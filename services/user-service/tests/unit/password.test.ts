import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { PasswordServiceImpl } from '../../src/services/password';

// Mock bcrypt at the module level
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

// Test constants
const TEST_USER = {
  id: 'user-1',
  email: 'test@example.com',
  roles: ['user']
};

const MOCK_PASSWORDS = {
  current: 'OldPassword123!',
  new: 'NewPassword123!',
  weak: 'weak',
  wrong: 'WrongPassword123!'
};

const MOCK_HASHES = {
  current: '$2a$12$mockedhash',
  new: '$2a$12$newmockedhash',
  old1: '$2a$12$oldhash1',
  old2: '$2a$12$oldhash2'
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

const setupBcryptMocks = (hashValue = MOCK_HASHES.new, compareValue = true) => {
  const bcrypt = require('bcryptjs');
  (bcrypt.hash as jest.Mock).mockResolvedValue(hashValue);
  (bcrypt.compare as jest.Mock).mockResolvedValue(compareValue);
};

const createTestPasswordRouter = (passwordService: PasswordServiceImpl) => {
  const router = express.Router();
  
  // POST /auth/password/reset-request
  router.post('/reset-request', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const result = await passwordService.requestPasswordReset(email);
      if (result) {
        return res.status(200).json({ success: true, message: 'Password reset requested' });
      } else {
        return res.status(500).json({ error: 'Internal server error' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /auth/password/reset
  router.post('/reset', async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    try {
      const result = await passwordService.resetPassword(token, newPassword);
      if (result) {
        return res.status(200).json({ success: true, message: 'Password reset successfully' });
      } else {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /auth/password/change
  router.post('/change', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }
    
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    try {
      const result = await passwordService.changePassword(req.user.id, currentPassword, newPassword);
      if (result) {
        return res.status(200).json({ success: true, message: 'Password changed successfully' });
      } else {
        return res.status(400).json({ error: 'Password change failed' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};

describe('Password Routes Integration Tests', () => {
  let app: express.Application;
  let mockDb: jest.Mocked<Pool>;
  let passwordService: PasswordServiceImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    passwordService = new PasswordServiceImpl(mockDb);
    app = createTestApp();
    app.use('/auth/password', createTestPasswordRouter(passwordService));
    setupBcryptMocks();
  });

  describe('POST /auth/password/reset-request', () => {
    const endpoint = '/auth/password/reset-request';

    describe('Success Cases', () => {
      it('should successfully request password reset for existing user', async () => {
        // Arrange
        (mockDb.query as jest.Mock)
          .mockResolvedValueOnce({ rows: [{ id: 'user-id' }] })
          .mockResolvedValueOnce({ rowCount: 1 });

        // Act
        const response = await request(app)
          .post(endpoint)
          .send({ email: TEST_USER.email });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockDb.query).toHaveBeenCalledTimes(2);
      });

      it('should not reveal if user exists (security)', async () => {
        // Arrange
        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

        // Act
        const response = await request(app)
          .post(endpoint)
          .send({ email: 'nonexistent@example.com' });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when email is missing', async () => {
        // Act
        const response = await request(app)
          .post(endpoint)
          .send({});

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Email is required');
      });
    });

    describe('Database Errors', () => {
      it('should handle database connection errors gracefully', async () => {
        // Arrange
        (mockDb.query as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'));

        // Act
        const response = await request(app)
          .post(endpoint)
          .send({ email: TEST_USER.email });

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Internal server error');
      });
    });
  });

  describe('POST /auth/password/reset', () => {
    const endpoint = '/auth/password/reset';

    describe('Success Cases', () => {
      it('should reset password with valid token', async () => {
        // Arrange
        const validTokenData = {
          user_id: TEST_USER.id,
          expires_at: new Date(Date.now() + 3600000), // 1 hour from now
          used: false
        };

        (mockDb.query as jest.Mock)
          .mockResolvedValueOnce({ rows: [validTokenData] })
          .mockResolvedValueOnce({ rowCount: 1 }) // Update password
          .mockResolvedValueOnce({ rowCount: 1 }) // Mark token as used
          .mockResolvedValueOnce({ rowCount: 1 }); // Add to password history

        // Act
        const response = await request(app)
          .post(endpoint)
          .send({ 
            token: 'valid-reset-token',
            newPassword: MOCK_PASSWORDS.new 
          });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockDb.query).toHaveBeenCalledTimes(4);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when token is missing', async () => {
        // Act
        const response = await request(app)
          .post(endpoint)
          .send({ newPassword: MOCK_PASSWORDS.new });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Token is required');
      });

      it('should return 400 when new password is missing', async () => {
        // Act
        const response = await request(app)
          .post(endpoint)
          .send({ token: 'valid-token' });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('New password is required');
      });
    });

    describe('Token Validation', () => {
      it('should return 400 for invalid token', async () => {
        // Arrange
        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

        // Act
        const response = await request(app)
          .post(endpoint)
          .send({ 
            token: 'invalid-token',
            newPassword: MOCK_PASSWORDS.new 
          });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid or expired token');
      });

      it('should return 400 for expired token', async () => {
        // Arrange
        const expiredTokenData = {
          user_id: TEST_USER.id,
          expires_at: new Date(Date.now() - 3600000), // 1 hour ago
          used: false
        };

        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [expiredTokenData] });

        // Act
        const response = await request(app)
          .post(endpoint)
          .send({ 
            token: 'expired-token',
            newPassword: MOCK_PASSWORDS.new 
          });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid or expired token');
      });

      it('should return 400 for already used token', async () => {
        // Arrange
        const usedTokenData = {
          user_id: TEST_USER.id,
          expires_at: new Date(Date.now() + 3600000),
          used: true
        };

        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [usedTokenData] });

        // Act
        const response = await request(app)
          .post(endpoint)
          .send({ 
            token: 'used-token',
            newPassword: MOCK_PASSWORDS.new 
          });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid or expired token');
      });
    });
  });

  describe('POST /auth/password/change', () => {
    const endpoint = '/auth/password/change';

    describe('Success Cases', () => {
      it('should change password for authenticated user', async () => {
        // Arrange
        (mockDb.query as jest.Mock)
          .mockResolvedValueOnce({ rows: [{ password: MOCK_HASHES.current }] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rowCount: 1 })
          .mockResolvedValueOnce({ rowCount: 1 });

        // Act
        const response = await request(app)
          .post(endpoint)
          .send({ 
            currentPassword: MOCK_PASSWORDS.current,
            newPassword: MOCK_PASSWORDS.new 
          });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockDb.query).toHaveBeenCalledTimes(4);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Arrange
        const appWithoutAuth = createTestApp(false);
        appWithoutAuth.use('/auth/password', createTestPasswordRouter(passwordService));

        // Act
        const response = await request(appWithoutAuth)
          .post(endpoint)
          .send({ 
            currentPassword: MOCK_PASSWORDS.current,
            newPassword: MOCK_PASSWORDS.new 
          });

        // Assert
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Authentication required');
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when current password is missing', async () => {
        // Act
        const response = await request(app)
          .post(endpoint)
          .send({ newPassword: MOCK_PASSWORDS.new });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Current password is required');
      });

      it('should return 400 when new password is missing', async () => {
        // Act
        const response = await request(app)
          .post(endpoint)
          .send({ currentPassword: MOCK_PASSWORDS.current });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('New password is required');
      });

      it('should return 400 when current password is incorrect', async () => {
        // Arrange
        setupBcryptMocks(MOCK_HASHES.new, false);
        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [{ password: MOCK_HASHES.current }] });

        // Act
        const response = await request(app)
          .post(endpoint)
          .send({ 
            currentPassword: MOCK_PASSWORDS.wrong,
            newPassword: MOCK_PASSWORDS.new 
          });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Password change failed');
      });
    });
  });
});

describe('Password Service Unit Tests', () => {
  let passwordService: PasswordServiceImpl;
  let mockDb: jest.Mocked<Pool>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    passwordService = new PasswordServiceImpl(mockDb);
    setupBcryptMocks();
  });

  describe('Password Reset Token Generation', () => {
    it('should generate a valid reset token', async () => {
      const token = await passwordService.generatePasswordResetToken('user-id');
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);
    });

    it('should generate unique tokens for multiple calls', async () => {
      const token1 = await passwordService.generatePasswordResetToken('user-id');
      const token2 = await passwordService.generatePasswordResetToken('user-id');
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('Password Strength Validation', () => {
    it('should accept strong password', () => {
      const result = passwordService.validatePasswordStrength('StrongPassword123!');
      expect(result.isValid).toBe(true);
    });

    it('should reject weak password', () => {
      const result = passwordService.validatePasswordStrength('weak');
      expect(result.isValid).toBe(false);
    });

    it('should reject no numbers', () => {
      const result = passwordService.validatePasswordStrength('WeakPassword!');
      expect(result.isValid).toBe(false);
    });

    it('should reject no numbers or special chars', () => {
      const result = passwordService.validatePasswordStrength('WeakPassword');
      expect(result.isValid).toBe(false);
    });

    it('should reject no special characters', () => {
      const result = passwordService.validatePasswordStrength('WeakPassword123');
      expect(result.isValid).toBe(false);
    });

    it('should reject no lowercase', () => {
      const result = passwordService.validatePasswordStrength('WEAKPASSWORD123!');
      expect(result.isValid).toBe(false);
    });

    it('should reject no uppercase', () => {
      const result = passwordService.validatePasswordStrength('weakpassword123!');
      expect(result.isValid).toBe(false);
    });

    it('should reject too short', () => {
      const result = passwordService.validatePasswordStrength('Short1!');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Password History Management', () => {
    it('should detect password reuse', async () => {
      setupBcryptMocks(MOCK_HASHES.new, true);
      (mockDb.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { password_hash: MOCK_HASHES.old1 },
          { password_hash: MOCK_HASHES.old2 }
        ]
      });

      const isReused = await passwordService.checkPasswordHistory('user-id', 'ReusedPassword123!');
      
      expect(isReused).toBe(true);
    });

    it('should allow new password when not in history', async () => {
      setupBcryptMocks(MOCK_HASHES.new, false);
      (mockDb.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { password_hash: MOCK_HASHES.old1 },
          { password_hash: MOCK_HASHES.old2 }
        ]
      });

      const isReused = await passwordService.checkPasswordHistory('user-id', 'NewUniquePassword123!');
      
      expect(isReused).toBe(false);
    });

    it('should handle empty password history', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const isReused = await passwordService.checkPasswordHistory('user-id', 'FirstPassword123!');
      
      expect(isReused).toBe(false);
    });
  });

  describe('Password Reset Email', () => {
    it('should send password reset email', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await passwordService.sendPasswordResetEmail(TEST_USER.email, 'reset-token');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        `Password reset email sent to ${TEST_USER.email} with token: reset-token`
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Password Change Operations', () => {
    describe('Success Cases', () => {
      it('should change password successfully', async () => {
        (mockDb.query as jest.Mock)
          .mockResolvedValueOnce({ rows: [{ password: MOCK_HASHES.current }] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rowCount: 1 })
          .mockResolvedValueOnce({ rowCount: 1 });

        const result = await passwordService.changePassword(
          TEST_USER.id,
          MOCK_PASSWORDS.current,
          MOCK_PASSWORDS.new
        );
        
        expect(result).toBe(true);
        expect(mockDb.query).toHaveBeenCalledTimes(4);
      });
    });

    describe('Failure Cases', () => {
      it('should fail when current password is incorrect', async () => {
        setupBcryptMocks(MOCK_HASHES.new, false);
        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [{ password: MOCK_HASHES.current }] });

        const result = await passwordService.changePassword(
          TEST_USER.id,
          MOCK_PASSWORDS.wrong,
          MOCK_PASSWORDS.new
        );
        
        expect(result).toBe(false);
      });

      it('should fail when user is not found', async () => {
        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

        const result = await passwordService.changePassword(
          'nonexistent-user',
          MOCK_PASSWORDS.current,
          MOCK_PASSWORDS.new
        );
        
        expect(result).toBe(false);
      });

      it('should fail when new password is weak', async () => {
        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [{ password: MOCK_HASHES.current }] });

        const result = await passwordService.changePassword(
          TEST_USER.id,
          MOCK_PASSWORDS.current,
          MOCK_PASSWORDS.weak
        );
        
        expect(result).toBe(false);
      });

      it('should fail when password is reused', async () => {
        const bcrypt = require('bcryptjs');
        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [{ password: MOCK_HASHES.current }] });
        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [{ password_hash: MOCK_HASHES.old1 }] });

        // Current password check passes, but reused password check fails
        (bcrypt.compare as jest.Mock)
          .mockResolvedValueOnce(true)  // Current password correct
          .mockResolvedValueOnce(true); // New password matches history

        const result = await passwordService.changePassword(
          TEST_USER.id,
          MOCK_PASSWORDS.current,
          'ReusedPassword123!'
        );
        
        expect(result).toBe(false);
      });
    });

    describe('Database Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        (mockDb.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

        const result = await passwordService.changePassword(
          TEST_USER.id,
          MOCK_PASSWORDS.current,
          MOCK_PASSWORDS.new
        );
        
        expect(result).toBe(false);
      });
    });
  });
});

describe('Edge Cases and Error Scenarios', () => {
  let passwordService: PasswordServiceImpl;
  let mockDb: jest.Mocked<Pool>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    passwordService = new PasswordServiceImpl(mockDb);
    setupBcryptMocks();
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent password changes', async () => {
      // Mock successful database operations for concurrent requests
      // Each call should get its own set of responses
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ password: MOCK_HASHES.current }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ password: MOCK_HASHES.current }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ password: MOCK_HASHES.current }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 });

      const promises = Array.from({ length: 3 }, () =>
        passwordService.changePassword(
          TEST_USER.id,
          MOCK_PASSWORDS.current,
          MOCK_PASSWORDS.new
        )
      );

      const results = await Promise.all(promises);
      
      // At least one should succeed
      expect(results.some(result => result === true)).toBe(true);
    });
  });

  describe('Memory and Performance', () => {
    it('should handle large password history efficiently', async () => {
      const largeHistory = Array.from({ length: 100 }, (_, i) => ({
        password_hash: `$2a$12$hash${i}`
      }));

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: largeHistory });

      // Mock bcrypt to return false for all comparisons (new password not in history)
      const bcrypt = require('bcryptjs');
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const startTime = Date.now();
      const result = await passwordService.checkPasswordHistory('user-id', 'NewPassword123!');
      const endTime = Date.now();

      expect(result).toBe(false);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});

describe('Complete Password Reset Flow', () => {
  it('should handle complete password reset cycle', async () => {
    // 1. Request reset
    // 2. Verify email sent
    // 3. Use reset token
    // 4. Verify password changed
    // 5. Verify old token invalidated
  });
});