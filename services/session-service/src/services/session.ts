import Redis from 'redis';
import { signJwt, verifyJwt } from '../utils/auth';

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

export class SessionService {
  private redis: Redis.RedisClientType;
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly SESSION_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

  constructor(redis: Redis.RedisClientType) {
    this.redis = redis;
  }

  /**
   * Create a new session
   */
  public async createSession(
    userId: string,
    deviceInfo: string,
    ipAddress: string,
    userAgent: string
  ): Promise<Session> {
    const sessionId = this.generateSessionId();
    const token = signJwt({ 
      userId, 
      sessionId, 
      type: 'session' 
    });
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_EXPIRY * 1000);

    const session: Session = {
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

    // Store session in Redis
    await this.redis.set(
      `${this.SESSION_PREFIX}${sessionId}`,
      JSON.stringify(session),
      { EX: this.SESSION_EXPIRY }
    );

    // Add session to user's session list
    await this.redis.sAdd(`${this.USER_SESSIONS_PREFIX}${userId}`, sessionId);
    await this.redis.expire(`${this.USER_SESSIONS_PREFIX}${userId}`, this.SESSION_EXPIRY);

    return session;
  }

  /**
   * Get session by ID
   */
  public async getSession(sessionId: string): Promise<Session | null> {
    const sessionData = await this.redis.get(`${this.SESSION_PREFIX}${sessionId}`);
    if (!sessionData) {
      return null;
    }

    const session: Session = JSON.parse(sessionData);
    // Convert string dates to Date objects if necessary
    session.createdAt = new Date(session.createdAt);
    session.expiresAt = new Date(session.expiresAt);
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      await this.invalidateSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Get session by token
   */
  public async getSessionByToken(token: string): Promise<Session | null> {
    try {
      const decoded = verifyJwt(token) as any;
      if (!decoded || !decoded.sessionId) {
        return null;
      }

      return await this.getSession(decoded.sessionId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all active sessions for a user
   */
  public async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const sessionIds = await this.redis.sMembers(`${this.USER_SESSIONS_PREFIX}${userId}`);
    const sessions: SessionInfo[] = [];

    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session && session.isActive) {
        sessions.push({
          sessionId: session.id,
          deviceInfo: session.deviceInfo,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          lastActive: session.createdAt // TODO: Update this with actual last active time
        });
      }
    }

    return sessions;
  }

  /**
   * Invalidate a specific session
   */
  public async invalidateSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      // Remove from Redis
      await this.redis.del(`${this.SESSION_PREFIX}${sessionId}`);
      
      // Remove from user's session list
      await this.redis.sRem(`${this.USER_SESSIONS_PREFIX}${session.userId}`, sessionId);
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  public async invalidateAllUserSessions(userId: string): Promise<void> {
    const sessionIds = await this.redis.sMembers(`${this.USER_SESSIONS_PREFIX}${userId}`);
    
    for (const sessionId of sessionIds) {
      await this.redis.del(`${this.SESSION_PREFIX}${sessionId}`);
    }
    
    await this.redis.del(`${this.USER_SESSIONS_PREFIX}${userId}`);
  }

  /**
   * Invalidate all sessions except the current one
   */
  public async invalidateOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    const sessionIds = await this.redis.sMembers(`${this.USER_SESSIONS_PREFIX}${userId}`);
    
    for (const sessionId of sessionIds) {
      if (sessionId !== currentSessionId) {
        await this.redis.del(`${this.SESSION_PREFIX}${sessionId}`);
        await this.redis.sRem(`${this.USER_SESSIONS_PREFIX}${userId}`, sessionId);
      }
    }
  }

  /**
   * Check concurrent session limit
   */
  public async checkConcurrentSessionLimit(userId: string, maxSessions: number = 5): Promise<boolean> {
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

  /**
   * Extend session expiry
   */
  public async extendSession(sessionId: string, extensionMinutes: number = 30): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      const newExpiry = new Date(session.expiresAt.getTime() + extensionMinutes * 60 * 1000);
      session.expiresAt = newExpiry;

      await this.redis.set(
        `${this.SESSION_PREFIX}${sessionId}`,
        JSON.stringify(session),
        { EX: this.SESSION_EXPIRY }
      );
    }
  }

  /**
   * Update session activity
   */
  public async updateSessionActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      // Extend session by 30 minutes on activity
      await this.extendSession(sessionId, 30);
    }
  }

  /**
   * Clean up expired sessions
   */
  public async cleanupExpiredSessions(): Promise<void> {
    // This would typically be done by Redis TTL, but we can also manually clean up
    // For now, we'll rely on Redis TTL for automatic cleanup
    // In a production environment, you might want to add a scheduled job
  }

  /**
   * Get session statistics
   */
  public async getSessionStats(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    oldestSession: Date | null;
    newestSession: Date | null;
  }> {
    const sessions = await this.getUserSessions(userId);
    const activeSessions = sessions.filter(s => s.createdAt > new Date(Date.now() - this.SESSION_EXPIRY * 1000));

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      oldestSession: sessions.length > 0 ? new Date(Math.min(...sessions.map(s => s.createdAt.getTime()))) : null,
      newestSession: sessions.length > 0 ? new Date(Math.max(...sessions.map(s => s.createdAt.getTime()))) : null
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default SessionService; 