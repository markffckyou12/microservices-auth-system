import Redis from 'redis';
export interface Session {
    id: string;
    userId: string;
    token: string;
    deviceInfo: string;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    expiresAt: Date;
    isActive: boolean;
}
export interface SessionInfo {
    sessionId: string;
    deviceInfo: string;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    lastActive: Date;
}
export declare class SessionService {
    private redis;
    private readonly SESSION_PREFIX;
    private readonly USER_SESSIONS_PREFIX;
    private readonly SESSION_EXPIRY;
    constructor(redis: Redis.RedisClientType);
    createSession(userId: string, deviceInfo: string, ipAddress: string, userAgent: string): Promise<Session>;
    getSession(sessionId: string): Promise<Session | null>;
    getSessionByToken(token: string): Promise<Session | null>;
    getUserSessions(userId: string): Promise<SessionInfo[]>;
    invalidateSession(sessionId: string): Promise<void>;
    invalidateAllUserSessions(userId: string): Promise<void>;
    invalidateOtherSessions(userId: string, currentSessionId: string): Promise<void>;
    checkConcurrentSessionLimit(userId: string, maxSessions?: number): Promise<boolean>;
    extendSession(sessionId: string, extensionMinutes?: number): Promise<void>;
    updateSessionActivity(sessionId: string): Promise<void>;
    cleanupExpiredSessions(): Promise<void>;
    getSessionStats(userId: string): Promise<{
        totalSessions: number;
        activeSessions: number;
        oldestSession: Date | null;
        newestSession: Date | null;
    }>;
    private generateSessionId;
}
export default SessionService;
//# sourceMappingURL=session.d.ts.map