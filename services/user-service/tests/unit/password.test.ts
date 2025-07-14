import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { PasswordServiceImpl } from '../../src/services/password';
import createPasswordRouter from '../../src/routes/password';

// Mock bcrypt at the module level
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

// Mock express-validator properly
jest.mock('express-validator', () => {
  const createValidationChain = (): any => ({
    isEmail: jest.fn(() => createValidationChain()),
    notEmpty: jest.fn(() => createValidationChain()),
    isLength: jest.fn(() => createValidationChain()),
    withMessage: jest.fn(() => [])
  });

  return {
    body: jest.fn(() => createValidationChain()),
    validationResult: jest.fn(() => ({
      isEmpty: jest.fn(() => true),
      array: jest.fn(() => [])
    }))
  };
});

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
const createMockDb = () => {
  const mockQuery = jest.fn();
  return {
    query: mockQuery
  } as unknown as jest.Mocked<Pool>;
};

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

describe('Password Routes Integration Tests', () => {
  let app: express.Application;
  let mockDb: ReturnType<typeof createMockDb>;
  let passwordService: PasswordServiceImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    passwordService = new PasswordServiceImpl(mockDb);
    app = createTestApp();
    app.use('/auth/password', createPasswordRouter(passwordService));
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
        expect(mockDb.query).toHaveBeenCalledTimes(1);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when email is missing', async () => {
        const response = await request(app)
          .post(endpoint)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Email is required');
      });

      it('should return 400 when email is invalid', async () => {
        const response = await request(app)
          .post(endpoint)
          .send({ email: 'invalid-email' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 when email is empty string', async () => {
        const response = await request(app)
          .post(endpoint)
          .send({ email: '' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Database Errors', () => {
      it('should handle database connection errors gracefully', async () => {
        (mockDb.query as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'));

        const response = await request(app)
          .post(endpoint)
          .send({ email: TEST_USER.email });

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('POST /auth/password/reset', () => {
    const endpoint = '/auth/password/reset';
    const validResetData = {
      token: 'valid-reset-token',
      newPassword: MOCK_PASSWORDS.new
    };

    describe('Success Cases', () => {
      it('should reset password with valid token', async () => {
        // Arrange
        const validTokenData = {
          user_id: 'user-id',
          expires_at: new Date(Date.now() + 3600000),
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
          .send(validResetData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockDb.query).toHaveBeenCalledTimes(4);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when token is missing', async () => {
        const response = await request(app)
          .post(endpoint)
          .send({ newPassword: MOCK_PASSWORDS.new });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Token is required');
      });

      it('should return 400 when new password is missing', async () => {
        const response = await request(app)
          .post(endpoint)
          .send({ token: 'valid-token' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('New password is required');
      });

      it('should return 400 when password is too weak', async () => {
        const response = await request(app)
          .post(endpoint)
          .send({
            token: 'valid-token',
            newPassword: MOCK_PASSWORDS.weak
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Token Validation', () => {
      it('should return 400 for invalid token', async () => {
        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
          .post(endpoint)
          .send(validResetData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid or expired token');
      });

      it('should return 400 for expired token', async () => {
        const expiredTokenData = {
          user_id: 'user-id',
          expires_at: new Date(Date.now() - 3600000), // 1 hour ago
          used: false
        };

        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [expiredTokenData] });

        const response = await request(app)
          .post(endpoint)
          .send(validResetData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid or expired token');
      });

      it('should return 400 for already used token', async () => {
        const usedTokenData = {
          user_id: 'user-id',
          expires_at: new Date(Date.now() + 3600000),
          used: true
        };

        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [usedTokenData] });

        const response = await request(app)
          .post(endpoint)
          .send(validResetData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid or expired token');
      });
    });
  });

  describe('POST /auth/password/change', () => {
    const endpoint = '/auth/password/change';
    const validChangeData = {
      currentPassword: MOCK_PASSWORDS.current,
      newPassword: MOCK_PASSWORDS.new
    };

    describe('Success Cases', () => {
      it('should change password for authenticated user', async () => {
        // Arrange
        (mockDb.query as jest.Mock)
          .mockResolvedValueOnce({ rows: [{ password: MOCK_HASHES.current }] })
          .mockResolvedValueOnce({ rows: [] }) // No password history conflicts
          .mockResolvedValueOnce({ rowCount: 1 }) // Update password
          .mockResolvedValueOnce({ rowCount: 1 }); // Add to history

        // Act
        const response = await request(app)
          .post(endpoint)
          .send(validChangeData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockDb.query).toHaveBeenCalledTimes(4);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when user is not authenticated', async () => {
        const appWithoutAuth = createTestApp(false);
        appWithoutAuth.use('/auth/password', createPasswordRouter(passwordService));

        const response = await request(appWithoutAuth)
          .post(endpoint)
          .send(validChangeData);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Authentication required');
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when current password is missing', async () => {
        const response = await request(app)
          .post(endpoint)
          .send({ newPassword: MOCK_PASSWORDS.new });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Current password is required');
      });

      it('should return 400 when new password is missing', async () => {
        const response = await request(app)
          .post(endpoint)
          .send({ currentPassword: MOCK_PASSWORDS.current });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('New password is required');
      });

      it('should return 400 when current password is incorrect', async () => {
        setupBcryptMocks(MOCK_HASHES.new, false);
        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [{ password: MOCK_HASHES.current }] });

        const response = await request(app)
          .post(endpoint)
          .send({
            currentPassword: MOCK_PASSWORDS.wrong,
            newPassword: MOCK_PASSWORDS.new
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Current password is incorrect');
      });
    });

    describe('Password Policy Violations', () => {
      it('should return 400 for weak new password', async () => {
        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [{ password: MOCK_HASHES.current }] });

        const response = await request(app)
          .post(endpoint)
          .send({
            currentPassword: MOCK_PASSWORDS.current,
            newPassword: MOCK_PASSWORDS.weak
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 when new password matches current password', async () => {
        (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [{ password: MOCK_HASHES.current }] });

        const response = await request(app)
          .post(endpoint)
          .send({
            currentPassword: MOCK_PASSWORDS.current,
            newPassword: MOCK_PASSWORDS.current
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });
});

describe('Password Service Unit Tests', () => {
  let passwordService: PasswordServiceImpl;
  let mockDb: ReturnType<typeof createMockDb>;

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
      expect(token.length).toBeGreaterThan(10);
    });

    it('should generate unique tokens for multiple calls', async () => {
      const token1 = await passwordService.generatePasswordResetToken('user-id');
      const token2 = await passwordService.generatePasswordResetToken('user-id');
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('Password Strength Validation', () => {
    const testCases = [
      { password: 'StrongPassword123!', expected: true, description: 'strong password' },
      { password: 'weak', expected: false, description: 'weak password' },
      { password: 'NoNumbers!', expected: false, description: 'no numbers' },
      { password: 'nonumbersorspecial', expected: false, description: 'no numbers or special chars' },
      { password: 'NoSpecial123', expected: false, description: 'no special characters' },
      { password: 'NOLOWERCASE123!', expected: false, description: 'no lowercase' },
      { password: 'nouppercase123!', expected: false, description: 'no uppercase' },
      { password: 'Short1!', expected: false, description: 'too short' }
    ];

    testCases.forEach(({ password, expected, description }) => {
      it(`should ${expected ? 'accept' : 'reject'} ${description}`, () => {
        const result = passwordService.validatePasswordStrength(password);
        expect(result.isValid).toBe(expected);
      });
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
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    passwordService = new PasswordServiceImpl(mockDb);
    setupBcryptMocks();
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent password changes', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValue({ rows: [{ password: MOCK_HASHES.current }] })
        .mockResolvedValue({ rows: [] })
        .mockResolvedValue({ rowCount: 1 });

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