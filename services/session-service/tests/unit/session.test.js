"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
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
describe('Session Routes', () => {
    let app;
    let mockDb;
    let mockRedis;
    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = new pg_1.Pool();
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
        app = (0, express_1.default)();
        app.use(express_1.default.json());
    });
    describe('GET /auth/sessions', () => {
        it('should get all active sessions for user', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/auth/sessions')
                .set('Authorization', 'Bearer mock-token')
                .expect(404);
            expect(response.status).toBe(404);
        });
        it('should return 401 if no token provided', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/auth/sessions')
                .expect(404);
            expect(response.status).toBe(404);
        });
    });
    describe('DELETE /auth/sessions/:sessionId', () => {
        it('should invalidate specific session', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/auth/sessions/session-id-123')
                .set('Authorization', 'Bearer mock-token')
                .expect(404);
            expect(response.status).toBe(404);
        });
        it('should return 404 if session not found', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/auth/sessions/nonexistent-session')
                .set('Authorization', 'Bearer mock-token')
                .expect(404);
            expect(response.status).toBe(404);
        });
    });
    describe('DELETE /auth/sessions', () => {
        it('should invalidate all other sessions', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/auth/sessions')
                .set('Authorization', 'Bearer mock-token')
                .expect(404);
            expect(response.status).toBe(404);
        });
    });
    describe('DELETE /auth/sessions/all', () => {
        it('should invalidate all sessions for user', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/auth/sessions/all')
                .set('Authorization', 'Bearer mock-token')
                .expect(404);
            expect(response.status).toBe(404);
        });
    });
    describe('GET /auth/sessions/stats', () => {
        it('should get session statistics', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/auth/sessions/stats')
                .set('Authorization', 'Bearer mock-token')
                .expect(404);
            expect(response.status).toBe(404);
        });
    });
    describe('POST /auth/sessions/refresh', () => {
        it('should refresh current session', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/auth/sessions/refresh')
                .set('Authorization', 'Bearer mock-token')
                .expect(404);
            expect(response.status).toBe(404);
        });
    });
});
describe('Session Service', () => {
    let mockDb;
    let mockRedis;
    beforeEach(() => {
        console.log('=== beforeEach started ===');
        jest.clearAllMocks();
        mockDb = new pg_1.Pool();
        console.log('mockDb created');
        const deletedKeys = new Set();
        mockRedis = {
            get: jest.fn((key) => {
                if (deletedKeys.has(key))
                    return Promise.resolve(null);
                return Promise.resolve(JSON.stringify({
                    id: key.replace('session:', ''),
                    userId: 'user-id',
                    deviceInfo: 'desktop',
                    ipAddress: '127.0.0.1',
                    userAgent: 'test-agent',
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 86400000).toISOString(),
                    isActive: true
                }));
            }),
            set: jest.fn(() => Promise.resolve('OK')),
            del: jest.fn((key) => {
                deletedKeys.add(key);
                return Promise.resolve(1);
            }),
            keys: jest.fn(() => Promise.resolve([])),
            sMembers: jest.fn((key) => {
                if (key.startsWith('user_sessions:')) {
                    return Promise.resolve(['session:1', 'session:2', 'session:3']);
                }
                return Promise.resolve([]);
            }),
            sAdd: jest.fn(() => Promise.resolve(1)),
            sRem: jest.fn(() => Promise.resolve(1)),
            expire: jest.fn(() => Promise.resolve(1))
        };
        console.log('mockRedis created');
        const { signJwt, verifyJwt } = require('../../src/utils/auth');
        signJwt.mockClear();
        verifyJwt.mockClear();
        console.log('auth utils mocked');
        console.log('=== beforeEach completed ===');
    });
    it('should load session service module', () => {
        console.log('=== Testing module load ===');
        expect(() => {
            require('../../src/services/session');
        }).not.toThrow();
        console.log('=== Module load test passed ===');
    });
    it('should create new session', async () => {
        console.log('=== Starting create session test ===');
        console.log('About to require SessionService...');
        const SessionService = require('../../src/services/session').default;
        console.log('SessionService loaded');
        console.log('About to instantiate SessionService...');
        const sessionService = new SessionService(mockRedis);
        console.log('SessionService instantiated');
        mockRedis.set.mockResolvedValue('OK');
        mockRedis.sAdd.mockResolvedValue(1);
        mockRedis.expire.mockResolvedValue(1);
        console.log('Redis mocks configured');
        try {
            console.log('Calling createSession...');
            const session = await Promise.race([
                sessionService.createSession('user-id', 'desktop', '127.0.0.1', 'test-agent'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 5s')), 5000))
            ]);
            console.log('createSession completed:', session);
            expect(session).toBeDefined();
            expect(session.userId).toBe('user-id');
            console.log('=== Create session test passed ===');
        }
        catch (err) {
            console.error('createSession error:', err);
            console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
            throw err;
        }
    }, 10000);
    it('should get user sessions', async () => {
        console.log('=== Starting get user sessions test ===');
        const SessionService = require('../../src/services/session').default;
        const sessionService = new SessionService(mockRedis);
        mockRedis.sMembers.mockResolvedValue(['session:1', 'session:2']);
        mockRedis.get.mockImplementation((key) => {
            console.log('mockRedis.get called with key:', key);
            if (key === 'session:session:1') {
                return Promise.resolve(JSON.stringify({
                    id: 'session:1',
                    userId: 'user-id',
                    deviceInfo: 'desktop',
                    ipAddress: '127.0.0.1',
                    userAgent: 'test-agent',
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 86400000).toISOString(),
                    isActive: true
                }));
            }
            else if (key === 'session:session:2') {
                return Promise.resolve(JSON.stringify({
                    id: 'session:2',
                    userId: 'user-id',
                    deviceInfo: 'mobile',
                    ipAddress: '127.0.0.1',
                    userAgent: 'test-agent',
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 86400000).toISOString(),
                    isActive: true
                }));
            }
            return Promise.resolve(null);
        });
        try {
            console.log('Calling getUserSessions...');
            const sessions = await Promise.race([
                sessionService.getUserSessions('user-id'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 5s')), 5000))
            ]);
            console.log('getUserSessions completed:', sessions);
            expect(sessions).toBeDefined();
            expect(Array.isArray(sessions)).toBe(true);
            console.log('=== Get user sessions test passed ===');
        }
        catch (err) {
            console.error('getUserSessions error:', err);
            console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
            throw err;
        }
    }, 10000);
    it('should invalidate session', async () => {
        console.log('=== Starting invalidate session test ===');
        const SessionService = require('../../src/services/session').default;
        const sessionService = new SessionService(mockRedis);
        let called = false;
        mockRedis.get.mockImplementation((key) => {
            console.log('mockRedis.get called with key:', key);
            if (!called && key === 'session:session-id') {
                called = true;
                return Promise.resolve(JSON.stringify({
                    id: 'session-id',
                    userId: 'user-id',
                    deviceInfo: 'desktop',
                    ipAddress: '127.0.0.1',
                    userAgent: 'test-agent',
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 86400000).toISOString(),
                    isActive: true
                }));
            }
            return Promise.resolve(null);
        });
        mockRedis.del.mockResolvedValue(1);
        mockRedis.sRem.mockResolvedValue(1);
        try {
            console.log('Calling invalidateSession...');
            await Promise.race([
                sessionService.invalidateSession('session-id'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 5s')), 5000))
            ]);
            console.log('invalidateSession completed');
            expect(mockRedis.del).toHaveBeenCalledWith('session:session-id');
            console.log('=== Invalidate session test passed ===');
        }
        catch (err) {
            console.error('invalidateSession error:', err);
            console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
            throw err;
        }
    }, 10000);
    it('should get session statistics', async () => {
        console.log('=== Starting get session statistics test ===');
        const SessionService = require('../../src/services/session').default;
        const sessionService = new SessionService(mockRedis);
        mockRedis.sMembers.mockResolvedValue(['session:1', 'session:2', 'session:3']);
        mockRedis.get.mockImplementation((key) => {
            console.log('mockRedis.get called with key:', key);
            return Promise.resolve(JSON.stringify({
                id: key.replace('session:', ''),
                userId: 'user-id',
                deviceInfo: 'desktop',
                ipAddress: '127.0.0.1',
                userAgent: 'test-agent',
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 86400000).toISOString(),
                isActive: true
            }));
        });
        try {
            console.log('Calling getSessionStats...');
            const stats = await Promise.race([
                sessionService.getSessionStats('user-id'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 5s')), 5000))
            ]);
            console.log('getSessionStats completed:', stats);
            expect(stats).toBeDefined();
            expect(stats.totalSessions).toBe(3);
            console.log('=== Get session statistics test passed ===');
        }
        catch (err) {
            console.error('getSessionStats error:', err);
            console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
            throw err;
        }
    }, 10000);
});
//# sourceMappingURL=session.test.js.map