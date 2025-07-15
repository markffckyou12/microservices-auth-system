import { AuthService } from '../../src/services/auth';
import { Pool } from 'pg';

// Mock dependencies
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

describe('Auth Service Integration Tests', () => {
  let authService: AuthService;
  let mockDb: jest.Mocked<Pool>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = new Pool() as jest.Mocked<Pool>;
    authService = new AuthService(mockDb);
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
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

      const result = await authService.registerUser({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email', 'test@example.com');
    });

    it('should throw error for duplicate email', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ 
          rows: [{ id: 'existing-user-id', email: 'duplicate@example.com' }] 
        });

      mockDb.query = mockQuery;

      await expect(authService.registerUser({
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      })).rejects.toThrow('User already exists');
    });
  });

  describe('User Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'login-user-id', 
            email: 'login@example.com',
            password_hash: 'mock-hashed-password',
            first_name: 'Login',
            last_name: 'User'
          }] 
        });

      mockDb.query = mockQuery;

      const result = await authService.loginUser({
        email: 'login@example.com',
        password: 'password123'
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('email', 'login@example.com');
    });

    it('should throw error for non-existent user', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [] });

      mockDb.query = mockQuery;

      await expect(authService.loginUser({
        email: 'nonexistent@example.com',
        password: 'password123'
      })).rejects.toThrow('User not found');
    });
  });

  describe('JWT Token Management', () => {
    it('should generate JWT token', async () => {
      const token = await authService.generateToken('user-id');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should verify JWT token', async () => {
      const payload = await authService.verifyToken('mock-jwt-token');
      expect(payload).toHaveProperty('userId');
    });
  });

  describe('Password Management', () => {
    it('should hash password', async () => {
      const hashedPassword = await authService.hashPassword('password123');
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe('password123');
    });

    it('should verify password', async () => {
      const isValid = await authService.verifyPassword('password123', 'mock-hashed-password');
      expect(isValid).toBe(true);
    });
  });
});
