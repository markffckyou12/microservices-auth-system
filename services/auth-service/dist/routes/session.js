"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createSessionRoutes;
const express_1 = require("express");
const session_1 = __importDefault(require("../services/session"));
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
function createSessionRoutes(db, redis) {
    const sessionService = new session_1.default(redis);
    // Middleware to extract user from JWT token
    const authenticateUser = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }
            const token = authHeader.substring(7);
            const decoded = (0, auth_1.verifyJwt)(token);
            if (!decoded || !decoded.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }
            req.user = { id: decoded.userId };
            next();
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    };
    /**
     * @route GET /auth/sessions
     * @desc Get all active sessions for user
     */
    router.get('/', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const sessions = await sessionService.getUserSessions(userId);
            res.json({
                success: true,
                data: {
                    sessions
                }
            });
        }
        catch (error) {
            console.error('Get sessions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get sessions'
            });
        }
    });
    /**
     * @route DELETE /auth/sessions/:sessionId
     * @desc Invalidate specific session
     */
    router.delete('/:sessionId', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const { sessionId } = req.params;
            // Verify session belongs to user
            const sessions = await sessionService.getUserSessions(userId);
            const sessionExists = sessions.some(s => s.sessionId === sessionId);
            if (!sessionExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found'
                });
            }
            await sessionService.invalidateSession(sessionId);
            res.json({
                success: true,
                message: 'Session invalidated successfully'
            });
        }
        catch (error) {
            console.error('Invalidate session error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to invalidate session'
            });
        }
    });
    /**
     * @route DELETE /auth/sessions
     * @desc Invalidate all other sessions (keep current)
     */
    router.delete('/', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const authHeader = req.headers.authorization;
            const token = authHeader.substring(7);
            // Get current session ID from token
            const decoded = (0, auth_1.verifyJwt)(token);
            const currentSessionId = decoded.sessionId;
            await sessionService.invalidateOtherSessions(userId, currentSessionId);
            res.json({
                success: true,
                message: 'All other sessions invalidated successfully'
            });
        }
        catch (error) {
            console.error('Invalidate other sessions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to invalidate other sessions'
            });
        }
    });
    /**
     * @route DELETE /auth/sessions/all
     * @desc Invalidate all sessions for user
     */
    router.delete('/all', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            await sessionService.invalidateAllUserSessions(userId);
            res.json({
                success: true,
                message: 'All sessions invalidated successfully'
            });
        }
        catch (error) {
            console.error('Invalidate all sessions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to invalidate all sessions'
            });
        }
    });
    /**
     * @route GET /auth/sessions/stats
     * @desc Get session statistics
     */
    router.get('/stats', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const stats = await sessionService.getSessionStats(userId);
            res.json({
                success: true,
                data: {
                    stats
                }
            });
        }
        catch (error) {
            console.error('Session stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get session statistics'
            });
        }
    });
    /**
     * @route POST /auth/sessions/refresh
     * @desc Refresh current session
     */
    router.post('/refresh', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const authHeader = req.headers.authorization;
            const token = authHeader.substring(7);
            // Get current session ID from token
            const decoded = (0, auth_1.verifyJwt)(token);
            const currentSessionId = decoded.sessionId;
            await sessionService.updateSessionActivity(currentSessionId);
            res.json({
                success: true,
                message: 'Session refreshed successfully'
            });
        }
        catch (error) {
            console.error('Session refresh error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to refresh session'
            });
        }
    });
    /**
     * @route POST /auth/sessions/check-limit
     * @desc Check concurrent session limit
     */
    router.post('/check-limit', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const { maxSessions = 5 } = req.body;
            const canCreateNewSession = await sessionService.checkConcurrentSessionLimit(userId, maxSessions);
            res.json({
                success: true,
                data: {
                    canCreateNewSession,
                    maxSessions
                }
            });
        }
        catch (error) {
            console.error('Check session limit error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check session limit'
            });
        }
    });
    return router;
}
//# sourceMappingURL=session.js.map