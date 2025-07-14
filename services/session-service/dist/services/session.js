"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const auth_1 = require("../utils/auth");
class SessionService {
    constructor(redis) {
        this.SESSION_PREFIX = 'session:';
        this.USER_SESSIONS_PREFIX = 'user_sessions:';
        this.SESSION_EXPIRY = 24 * 60 * 60;
        this.redis = redis;
    }
    async createSession(userId, deviceInfo, ipAddress, userAgent) {
        const sessionId = this.generateSessionId();
        const token = (0, auth_1.signJwt)({
            userId,
            sessionId,
            type: 'session'
        });
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.SESSION_EXPIRY * 1000);
        const session = {
            id: sessionId,
            userId,
            token,
            deviceInfo,
            ipAddress,
            userAgent,
            createdAt: now,
            expiresAt,
            isActive: true
        };
        await this.redis.set(`${this.SESSION_PREFIX}${sessionId}`, JSON.stringify(session), { EX: this.SESSION_EXPIRY });
        await this.redis.sAdd(`${this.USER_SESSIONS_PREFIX}${userId}`, sessionId);
        await this.redis.expire(`${this.USER_SESSIONS_PREFIX}${userId}`, this.SESSION_EXPIRY);
        return session;
    }
    async getSession(sessionId) {
        const sessionData = await this.redis.get(`${this.SESSION_PREFIX}${sessionId}`);
        if (!sessionData) {
            return null;
        }
        const session = JSON.parse(sessionData);
        session.createdAt = new Date(session.createdAt);
        session.expiresAt = new Date(session.expiresAt);
        if (new Date() > session.expiresAt) {
            await this.invalidateSession(sessionId);
            return null;
        }
        return session;
    }
    async getSessionByToken(token) {
        try {
            const decoded = (0, auth_1.verifyJwt)(token);
            if (!decoded || !decoded.sessionId) {
                return null;
            }
            return await this.getSession(decoded.sessionId);
        }
        catch (error) {
            return null;
        }
    }
    async getUserSessions(userId) {
        const sessionIds = await this.redis.sMembers(`${this.USER_SESSIONS_PREFIX}${userId}`);
        const sessions = [];
        for (const sessionId of sessionIds) {
            const session = await this.getSession(sessionId);
            if (session && session.isActive) {
                sessions.push({
                    sessionId: session.id,
                    deviceInfo: session.deviceInfo,
                    ipAddress: session.ipAddress,
                    userAgent: session.userAgent,
                    createdAt: session.createdAt,
                    lastActive: session.createdAt
                });
            }
        }
        return sessions;
    }
    async invalidateSession(sessionId) {
        const session = await this.getSession(sessionId);
        if (session) {
            await this.redis.del(`${this.SESSION_PREFIX}${sessionId}`);
            await this.redis.sRem(`${this.USER_SESSIONS_PREFIX}${session.userId}`, sessionId);
        }
    }
    async invalidateAllUserSessions(userId) {
        const sessionIds = await this.redis.sMembers(`${this.USER_SESSIONS_PREFIX}${userId}`);
        for (const sessionId of sessionIds) {
            await this.redis.del(`${this.SESSION_PREFIX}${sessionId}`);
        }
        await this.redis.del(`${this.USER_SESSIONS_PREFIX}${userId}`);
    }
    async invalidateOtherSessions(userId, currentSessionId) {
        const sessionIds = await this.redis.sMembers(`${this.USER_SESSIONS_PREFIX}${userId}`);
        for (const sessionId of sessionIds) {
            if (sessionId !== currentSessionId) {
                await this.redis.del(`${this.SESSION_PREFIX}${sessionId}`);
                await this.redis.sRem(`${this.USER_SESSIONS_PREFIX}${userId}`, sessionId);
            }
        }
    }
    async checkConcurrentSessionLimit(userId, maxSessions = 5) {
        const sessionIds = await this.redis.sMembers(`${this.USER_SESSIONS_PREFIX}${userId}`);
        const activeSessions = [];
        for (const sessionId of sessionIds) {
            const session = await this.getSession(sessionId);
            if (session && session.isActive) {
                activeSessions.push(session);
            }
        }
        return activeSessions.length < maxSessions;
    }
    async extendSession(sessionId, extensionMinutes = 30) {
        const session = await this.getSession(sessionId);
        if (session) {
            const newExpiry = new Date(session.expiresAt.getTime() + extensionMinutes * 60 * 1000);
            session.expiresAt = newExpiry;
            await this.redis.set(`${this.SESSION_PREFIX}${sessionId}`, JSON.stringify(session), { EX: this.SESSION_EXPIRY });
        }
    }
    async updateSessionActivity(sessionId) {
        const session = await this.getSession(sessionId);
        if (session) {
            await this.extendSession(sessionId, 30);
        }
    }
    async cleanupExpiredSessions() {
    }
    async getSessionStats(userId) {
        const sessions = await this.getUserSessions(userId);
        const activeSessions = sessions.filter(s => s.createdAt > new Date(Date.now() - this.SESSION_EXPIRY * 1000));
        return {
            totalSessions: sessions.length,
            activeSessions: activeSessions.length,
            oldestSession: sessions.length > 0 ? new Date(Math.min(...sessions.map(s => s.createdAt.getTime()))) : null,
            newestSession: sessions.length > 0 ? new Date(Math.max(...sessions.map(s => s.createdAt.getTime()))) : null
        };
    }
    generateSessionId() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.SessionService = SessionService;
exports.default = SessionService;
//# sourceMappingURL=session.js.map