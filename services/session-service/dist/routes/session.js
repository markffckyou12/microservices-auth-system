"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createSessionRoutes;
const express_1 = require("express");
const session_1 = __importDefault(require("../services/session"));
function createSessionRoutes(redis) {
    const router = (0, express_1.Router)();
    const sessionService = new session_1.default(redis);
    router.get('/', (async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const sessions = await sessionService.getUserSessions(userId);
            return res.json({ success: true, data: sessions });
        }
        catch (error) {
            console.error('Error getting user sessions:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }));
    router.get('/stats', (async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const stats = await sessionService.getSessionStats(userId);
            return res.json({ success: true, data: stats });
        }
        catch (error) {
            console.error('Error getting session stats:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }));
    router.post('/refresh', (async (req, res) => {
        try {
            const userId = req.user?.id;
            const sessionId = req.user?.sessionId;
            if (!userId || !sessionId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            await sessionService.updateSessionActivity(sessionId);
            return res.json({ success: true, message: 'Session refreshed' });
        }
        catch (error) {
            console.error('Error refreshing session:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }));
    router.delete('/all', (async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            await sessionService.invalidateAllUserSessions(userId);
            return res.json({ success: true, message: 'All sessions invalidated' });
        }
        catch (error) {
            console.error('Error invalidating all sessions:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }));
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
        }
        catch (error) {
            console.error('Error invalidating other sessions:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }));
    router.delete('/:sessionId', (async (req, res) => {
        try {
            const { sessionId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            await sessionService.invalidateSession(sessionId);
            return res.json({ success: true, message: 'Session invalidated' });
        }
        catch (error) {
            console.error('Error invalidating session:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }));
    return router;
}
//# sourceMappingURL=session.js.map