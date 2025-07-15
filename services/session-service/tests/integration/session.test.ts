import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';

// Mock dependencies following existing patterns
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn()
  }))
}));

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    sMembers: jest.fn(),
    sAdd: jest.fn(),
    sRem: jest.fn(),
    expire: jest.fn()
  }))
}));

// Mock auth utilities
const mockAuthUtils = {
  signJwt: jest.fn(({ userId, sessionId }) => `mock-token-${userId}-${sessionId}`),
  verifyJwt: jest.fn((token) => {
    const match = token.match(/^mock-token-(.+)-(.+)$/);
    if (match) {
      return { userId: match[1], sessionId: match[2] };
    }
    return { userId: 'mock-user-id', sessionId: 'mock-session-id' };
  })
};

jest.mock('../../src/utils/auth', () => mockAuthUtils);

// Import the route setup function
import { setupRoutes } from '../../src/routes';

describe('Session Service Integration Tests', () => {
  let app: express.Application;
  let mockDb: jest.Mocked<Pool>;
  let mockRedis: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock database
    mockDb = new Pool() as jest.Mocked<Pool>;
    
    // Create mock Redis
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      sMembers: jest.fn(),
      sAdd: jest.fn(),
      sRem: jest.fn(),
      expire: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn()
    };
    
    // Create Express app
    app = express();
    app.use(express.json());
  });

  // Helper function to add authentication middleware for tests
  const addAuthMiddleware = (userId: string = 'test-user-id', sessionId: string = 'test-session-id') => {
    app.use((req, res, next) => {
      req.user = { id: userId, sessionId };
      next();
    });
  };

  // Helper function to setup routes with authentication
  const setupRoutesWithAuth = (userId?: string, sessionId?: string) => {
    if (userId && sessionId) {
      addAuthMiddleware(userId, sessionId);
    }
    setupRoutes(app as any, mockRedis as any);
  };

  describe('GET /api/v1/sessions', () => {
    beforeEach(() => {
      // Mock Redis sMembers to return user sessions
      mockRedis.sMembers.mockResolvedValue([
        'session:session-1',
        'session:session-2',
        'session:session-3'
      ]);

      // Mock Redis get for each session
      mockRedis.get.mockImplementation((key: string) => {
        const sessionId = key.replace('session:', '');
        return Promise.resolve(JSON.stringify({
          id: sessionId,
          userId: 'test-user-id',
          userAgent: `Mozilla/5.0 (Test Browser ${sessionId})`,
          ipAddress: '127.0.0.1',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }));
      });
    });

    it('should retrieve all sessions for authenticated user', async () => {
      setupRoutesWithAuth('test-user-id', 'test-session-id');
      
      // Mock Redis sMembers to return user sessions with correct prefix
      mockRedis.sMembers.mockResolvedValue([
        'session-1',
        'session-2',
        'session-3'
      ]);

      // Mock Redis get for each session
      mockRedis.get.mockImplementation((key: string) => {
        const sessionId = key.replace('session:', '');
        return Promise.resolve(JSON.stringify({
          id: sessionId,
          userId: 'test-user-id',
          userAgent: `Mozilla/5.0 (Test Browser ${sessionId})`,
          ipAddress: '127.0.0.1',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isActive: true
        }));
      });
      
      const response = await request(app)
        .get('/api/v1/sessions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      
      response.body.data.forEach((session: any) => {
        expect(session).toHaveProperty('sessionId');
        expect(session).toHaveProperty('ipAddress');
        expect(session).toHaveProperty('userAgent');
        expect(session).toHaveProperty('createdAt');
        expect(session).toHaveProperty('lastActive');
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      setupRoutesWithAuth(); // No auth middleware
      
      const response = await request(app)
        .get('/api/v1/sessions');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    it('should return empty array for user with no sessions', async () => {
      setupRoutesWithAuth('test-user-id', 'test-session-id');
      
      // Mock Redis to return empty array for user with no sessions
      mockRedis.sMembers.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/sessions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual([]);
    });


  });

  describe('DELETE /api/v1/sessions/:sessionId', () => {
    let sessionId: string;

    beforeEach(() => {
      sessionId = 'test-session-id';
      
      // Mock Redis operations for session invalidation
      mockRedis.get.mockResolvedValue(JSON.stringify({
        id: sessionId,
        userId: 'test-user-id',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ipAddress: '127.0.0.1',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));
      mockRedis.del.mockResolvedValue(1);
      mockRedis.sRem.mockResolvedValue(1);
    });

    it('should invalidate specific session successfully', async () => {
      setupRoutesWithAuth('test-user-id', 'test-session-id');
      
      const response = await request(app)
        .delete(`/api/v1/sessions/${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Session invalidated');
    });

    it('should return 401 for unauthenticated user', async () => {
      setupRoutesWithAuth(); // No auth middleware
      
      const response = await request(app)
        .delete(`/api/v1/sessions/${sessionId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });
  });

  describe('DELETE /api/v1/sessions', () => {
    beforeEach(() => {
      // Mock Redis operations for invalidating other sessions
      mockRedis.sMembers.mockResolvedValue([
        'session:other-session-1',
        'session:other-session-2',
        'session:current-session-id'
      ]);
      mockRedis.del.mockResolvedValue(1);
      mockRedis.sRem.mockResolvedValue(1);
    });

    it('should invalidate all other sessions for authenticated user', async () => {
      setupRoutesWithAuth('test-user-id', 'current-session-id');
      
      const response = await request(app)
        .delete('/api/v1/sessions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Other sessions invalidated');
    });

    it('should return 401 for unauthenticated user', async () => {
      setupRoutesWithAuth(); // No auth middleware
      
      const response = await request(app)
        .delete('/api/v1/sessions');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });
  });

  describe('DELETE /api/v1/sessions/all', () => {
    beforeEach(() => {
      // Mock Redis operations for invalidating all sessions
      mockRedis.sMembers.mockResolvedValue([
        'session:session-1',
        'session:session-2',
        'session:session-3'
      ]);
      mockRedis.del.mockResolvedValue(1);
      mockRedis.sRem.mockResolvedValue(1);
    });

    it('should invalidate all sessions for authenticated user', async () => {
      setupRoutesWithAuth('test-user-id', 'test-session-id');
      
      // Mock Redis operations for invalidating all sessions
      mockRedis.sMembers.mockResolvedValue([
        'session-1',
        'session-2',
        'session-3'
      ]);
      mockRedis.del.mockResolvedValue(1);
      
      const response = await request(app)
        .delete('/api/v1/sessions/all');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'All sessions invalidated');
    });

    it('should return 401 for unauthenticated user', async () => {
      setupRoutesWithAuth(); // No auth middleware
      
      const response = await request(app)
        .delete('/api/v1/sessions/all');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });
  });

  describe('GET /api/v1/sessions/stats', () => {
    beforeEach(() => {
      // Mock Redis operations for session stats
      mockRedis.sMembers.mockResolvedValue([
        'session:session-1',
        'session:session-2',
        'session:session-3'
      ]);
      mockRedis.get.mockImplementation((key: string) => {
        const sessionId = key.replace('session:', '');
        return Promise.resolve(JSON.stringify({
          id: sessionId,
          userId: 'test-user-id',
          userAgent: `Mozilla/5.0 (Test Browser ${sessionId})`,
          ipAddress: '127.0.0.1',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }));
      });
    });

    it('should get session statistics for authenticated user', async () => {
      setupRoutesWithAuth('test-user-id', 'test-session-id');
      
      const response = await request(app)
        .get('/api/v1/sessions/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalSessions');
      expect(response.body.data).toHaveProperty('activeSessions');
    });

    it('should return 401 for unauthenticated user', async () => {
      setupRoutesWithAuth(); // No auth middleware
      
      const response = await request(app)
        .get('/api/v1/sessions/stats');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });
  });

  describe('POST /api/v1/sessions/refresh', () => {
    beforeEach(() => {
      // Mock Redis operations for session refresh
      mockRedis.get.mockResolvedValue(JSON.stringify({
        id: 'current-session-id',
        userId: 'test-user-id',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ipAddress: '127.0.0.1',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));
      mockRedis.set.mockResolvedValue('OK');
    });

    it('should refresh current session successfully', async () => {
      setupRoutesWithAuth('test-user-id', 'current-session-id');
      
      const response = await request(app)
        .post('/api/v1/sessions/refresh');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Session refreshed');
    });

    it('should return 401 for unauthenticated user', async () => {
      setupRoutesWithAuth(); // No auth middleware
      
      const response = await request(app)
        .post('/api/v1/sessions/refresh');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });
  });

  describe('Health Check Endpoints', () => {
    it('should return health status', async () => {
      setupRoutesWithAuth(); // No auth needed for health checks
      
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'session-service');
    });

    it('should return API status', async () => {
      setupRoutesWithAuth(); // No auth needed for health checks
      
      const response = await request(app)
        .get('/api/v1/sessions/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Session Service is running');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });
  });
}); 