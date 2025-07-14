import { Router, RequestHandler } from 'express';
import { RedisClientType } from 'redis';
import SessionService from '../services/session';

// Define user type for request
interface AuthenticatedUser {
  id: string;
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export default function createSessionRoutes(redis: RedisClientType) {
  const router = Router();
  const sessionService = new SessionService(redis);

  // Get all active sessions for user
  router.get('/', (async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const sessions = await sessionService.getUserSessions(userId);
      return res.json({ success: true, data: sessions });
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }) as RequestHandler);

  // Invalidate specific session
  router.delete('/:sessionId', (async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      await sessionService.invalidateSession(sessionId);
      return res.json({ success: true, message: 'Session invalidated' });
    } catch (error) {
      console.error('Error invalidating session:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }) as RequestHandler);

  // Invalidate all other sessions (keep current)
  router.delete('/', (async (req, res) => {
    try {
      const userId = req.user?.id;
      const currentSessionId = req.user?.sessionId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      if (currentSessionId) {
        await sessionService.invalidateOtherSessions(userId, currentSessionId);
      }
      return res.json({ success: true, message: 'Other sessions invalidated' });
    } catch (error) {
      console.error('Error invalidating other sessions:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }) as RequestHandler);

  // Invalidate all sessions for user
  router.delete('/all', (async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      await sessionService.invalidateAllUserSessions(userId);
      return res.json({ success: true, message: 'All sessions invalidated' });
    } catch (error) {
      console.error('Error invalidating all sessions:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }) as RequestHandler);

  // Get session statistics
  router.get('/stats', (async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const stats = await sessionService.getSessionStats(userId);
      return res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error getting session stats:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }) as RequestHandler);

  // Refresh current session
  router.post('/refresh', (async (req, res) => {
    try {
      const userId = req.user?.id;
      const sessionId = req.user?.sessionId;
      if (!userId || !sessionId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      await sessionService.updateSessionActivity(sessionId);
      return res.json({ success: true, message: 'Session refreshed' });
    } catch (error) {
      console.error('Error refreshing session:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }) as RequestHandler);

  return router;
} 