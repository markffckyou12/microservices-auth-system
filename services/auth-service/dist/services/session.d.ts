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
    /**
     * Create a new session
     */
    createSession(userId: string, deviceInfo: string, ipAddress: string, userAgent: string): Promise<Session>;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): Promise<Session | null>;
    /**
     * Get session by token
     */
    getSessionByToken(token: string): Promise<Session | null>;
    /**
     * Get all active sessions for a user
     */
    getUserSessions(userId: string): Promise<SessionInfo[]>;
    /**
     * Invalidate a specific session
     */
    invalidateSession(sessionId: string): Promise<void>;
    /**
     * Invalidate all sessions for a user
     */
    invalidateAllUserSessions(userId: string): Promise<void>;
    /**
     * Invalidate all sessions except the current one
     */
    invalidateOtherSessions(userId: string, currentSessionId: string): Promise<void>;
    /**
     * Check concurrent session limit
     */
    checkConcurrentSessionLimit(userId: string, maxSessions?: number): Promise<boolean>;
    /**
     * Extend session expiry
     */
    extendSession(sessionId: string, extensionMinutes?: number): Promise<void>;
    /**
     * Update session activity
     */
    updateSessionActivity(sessionId: string): Promise<void>;
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): Promise<void>;
    /**
     * Get session statistics
     */
    getSessionStats(userId: string): Promise<{
        totalSessions: number;
        activeSessions: number;
        oldestSession: Date | null;
        newestSession: Date | null;
    }>;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
}
export default SessionService;
//# sourceMappingURL=session.d.ts.map