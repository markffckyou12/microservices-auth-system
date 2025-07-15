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
      expire: jest.fn()
    };
    
    // Create Express app
    app = express();
    app.use(express.json());
  });

  describe('POST /sessions', () => {
    it('should create a new session successfully', async () => {
      const sessionData = {
        userId: 'test-user-id',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      // Mock Redis set operation
      mockRedis.set.mockResolvedValue('OK');

      const response = await request(app)
        .post('/sessions')
        .send(sessionData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('userId', sessionData.userId);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('expiresAt');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/sessions')
        .send({
          userId: 'test-user-id'
          // Missing other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /sessions/:sessionId', () => {
    let sessionId: string;

    beforeEach(() => {
      sessionId = 'test-session-id';
      
      // Mock Redis get operation
      mockRedis.get.mockResolvedValue(JSON.stringify({
        id: sessionId,
        userId: 'test-user-id',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ipAddress: '127.0.0.1',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));
    });

    it('should retrieve session by ID successfully', async () => {
      const response = await request(app)
        .get(`/sessions/${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessionId', sessionId);
      expect(response.body).toHaveProperty('userId', 'test-user-id');
      expect(response.body).toHaveProperty('userAgent', 'Mozilla/5.0 (Test Browser)');
      expect(response.body).toHaveProperty('ipAddress', '127.0.0.1');
    });

    it('should return 404 for non-existent session', async () => {
      // Mock Redis to return null for non-existent session
      mockRedis.get.mockResolvedValue(null);

      const response = await request(app)
        .get('/sessions/non-existent-session-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Session not found');
    });
  });

  describe('GET /sessions/user/:userId', () => {
    let userId: string;

    beforeEach(() => {
      userId = 'test-user-multiple-sessions';
      
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
          userId,
          userAgent: `Mozilla/5.0 (Test Browser ${sessionId})`,
          ipAddress: '127.0.0.1',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }));
      });
    });

    it('should retrieve all sessions for a user', async () => {
      const response = await request(app)
        .get(`/sessions/user/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessions');
      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(response.body.sessions.length).toBeGreaterThanOrEqual(2);
      
      response.body.sessions.forEach((session: any) => {
        expect(session).toHaveProperty('sessionId');
        expect(session).toHaveProperty('userId', userId);
        expect(session).toHaveProperty('userAgent');
        expect(session).toHaveProperty('ipAddress');
        expect(session).toHaveProperty('createdAt');
        expect(session).toHaveProperty('expiresAt');
      });
    });

    it('should return empty array for user with no sessions', async () => {
      // Mock Redis to return empty array for user with no sessions
      mockRedis.sMembers.mockResolvedValue([]);

      const response = await request(app)
        .get('/sessions/user/user-with-no-sessions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessions');
      expect(response.body.sessions).toEqual([]);
    });
  });

  describe('PUT /sessions/:sessionId', () => {
    let sessionId: string;

    beforeEach(() => {
      sessionId = 'test-session-id';
      
      // Mock Redis get for existing session
      mockRedis.get.mockResolvedValue(JSON.stringify({
        id: sessionId,
        userId: 'test-user-id',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ipAddress: '127.0.0.1',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));

      // Mock Redis set for update
      mockRedis.set.mockResolvedValue('OK');
    });

    it('should update session successfully', async () => {
      const updateData = {
        userAgent: 'Mozilla/5.0 (Updated Browser)',
        ipAddress: '192.168.1.100',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .put(`/sessions/${sessionId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessionId', sessionId);
      expect(response.body).toHaveProperty('userAgent', updateData.userAgent);
      expect(response.body).toHaveProperty('ipAddress', updateData.ipAddress);
      expect(response.body).toHaveProperty('expiresAt', updateData.expiresAt);
    });

    it('should return 404 for non-existent session', async () => {
      // Mock Redis to return null for non-existent session
      mockRedis.get.mockResolvedValue(null);

      const updateData = {
        userAgent: 'Mozilla/5.0 (Updated Browser)',
        ipAddress: '192.168.1.100'
      };

      const response = await request(app)
        .put('/sessions/non-existent-session-id')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Session not found');
    });
  });

  describe('DELETE /sessions/:sessionId', () => {
    let sessionId: string;

    beforeEach(() => {
      sessionId = 'test-session-id';
      
      // Mock Redis get for existing session
      mockRedis.get.mockResolvedValue(JSON.stringify({
        id: sessionId,
        userId: 'test-user-id',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ipAddress: '127.0.0.1',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));

      // Mock Redis del for deletion
      mockRedis.del.mockResolvedValue(1);
    });

    it('should delete session successfully', async () => {
      const response = await request(app)
        .delete(`/sessions/${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Session deleted successfully');
    });

    it('should return 404 for non-existent session', async () => {
      // Mock Redis to return null for non-existent session
      mockRedis.get.mockResolvedValue(null);

      const response = await request(app)
        .delete('/sessions/non-existent-session-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Session not found');
    });
  });

  describe('DELETE /sessions/user/:userId', () => {
    let userId: string;

    beforeEach(() => {
      userId = 'test-user-multiple-sessions-delete';
      
      // Mock Redis sMembers to return user sessions
      mockRedis.sMembers.mockResolvedValue([
        'session:session-1',
        'session:session-2',
        'session:session-3'
      ]);

      // Mock Redis del for deletion
      mockRedis.del.mockResolvedValue(1);
      mockRedis.sRem.mockResolvedValue(1);
    });

    it('should delete all sessions for a user', async () => {
      const response = await request(app)
        .delete(`/sessions/user/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'All sessions deleted successfully');
      expect(response.body).toHaveProperty('deletedCount');
      expect(response.body.deletedCount).toBeGreaterThanOrEqual(2);
    });

    it('should return 200 for user with no sessions', async () => {
      // Mock Redis to return empty array for user with no sessions
      mockRedis.sMembers.mockResolvedValue([]);

      const response = await request(app)
        .delete('/sessions/user/user-with-no-sessions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'All sessions deleted successfully');
      expect(response.body).toHaveProperty('deletedCount', 0);
    });
  });

  describe('GET /sessions/validate/:sessionId', () => {
    let sessionId: string;

    beforeEach(() => {
      sessionId = 'test-session-id';
      
      // Mock Redis get for active session
      mockRedis.get.mockResolvedValue(JSON.stringify({
        id: sessionId,
        userId: 'test-user-id',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ipAddress: '127.0.0.1',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      }));
    });

    it('should validate active session successfully', async () => {
      const response = await request(app)
        .get(`/sessions/validate/${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('session');
      expect(response.body.session).toHaveProperty('sessionId', sessionId);
    });

    it('should return 404 for non-existent session', async () => {
      // Mock Redis to return null for non-existent session
      mockRedis.get.mockResolvedValue(null);

      const response = await request(app)
        .get('/sessions/validate/non-existent-session-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Session not found');
    });
  });

  describe('GET /sessions/stats', () => {
    beforeEach(() => {
      // Mock Redis keys to return session keys
      mockRedis.keys.mockResolvedValue([
        'session:session-1',
        'session:session-2',
        'session:session-3'
      ]);

      // Mock Redis get for session data
      mockRedis.get.mockImplementation((key: string) => {
        const sessionId = key.replace('session:', '');
        return Promise.resolve(JSON.stringify({
          id: sessionId,
          userId: `user-${sessionId}`,
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }));
      });
    });

    it('should return session statistics', async () => {
      const response = await request(app)
        .get('/sessions/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalSessions');
      expect(response.body).toHaveProperty('activeSessions');
      expect(response.body).toHaveProperty('expiredSessions');
      expect(response.body).toHaveProperty('uniqueUsers');
      expect(typeof response.body.totalSessions).toBe('number');
      expect(typeof response.body.activeSessions).toBe('number');
      expect(typeof response.body.expiredSessions).toBe('number');
      expect(typeof response.body.uniqueUsers).toBe('number');
    });
  });
}); 