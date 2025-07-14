"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createPasswordRoutes;
const express_1 = require("express");
const password_1 = __importDefault(require("../services/password"));
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
function createPasswordRoutes(db) {
    const passwordService = new password_1.default(db);
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
     * @route POST /auth/password/reset-request
     * @desc Request password reset
     */
    router.post('/reset-request', async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }
            // Check if user exists
            const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
            if (userResult.rows.length === 0) {
                // Don't reveal if user exists or not
                return res.json({
                    success: true,
                    message: 'If the email exists, a password reset link has been sent'
                });
            }
            const userId = userResult.rows[0].id;
            const token = await passwordService.generatePasswordResetToken(userId);
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
            await passwordService.sendPasswordResetEmail(email, resetUrl);
            res.json({
                success: true,
                message: 'Password reset link sent to email'
            });
        }
        catch (error) {
            console.error('Password reset request error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send password reset email'
            });
        }
    });
    /**
     * @route POST /auth/password/reset
     * @desc Reset password with token
     */
    router.post('/reset', async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Token and new password are required'
                });
            }
            // Verify token
            const userId = await passwordService.verifyPasswordResetToken(token);
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }
            // Validate password strength
            const strength = passwordService.validatePasswordStrength(newPassword);
            if (!strength.isStrong) {
                return res.status(400).json({
                    success: false,
                    message: 'Password does not meet strength requirements',
                    data: {
                        strength
                    }
                });
            }
            // Check password history
            const wasUsedRecently = await passwordService.checkPasswordHistory(userId, newPassword);
            if (wasUsedRecently) {
                return res.status(400).json({
                    success: false,
                    message: 'Password was used recently. Please choose a different password'
                });
            }
            // Hash new password
            const bcrypt = require('bcryptjs');
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            // Update password
            await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
            // Add to password history
            await passwordService.addToPasswordHistory(userId, hashedPassword);
            // Mark token as used
            await passwordService.markPasswordResetTokenUsed(token);
            res.json({
                success: true,
                message: 'Password reset successfully'
            });
        }
        catch (error) {
            console.error('Password reset error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reset password'
            });
        }
    });
    /**
     * @route POST /auth/password/change
     * @desc Change password (authenticated user)
     */
    router.post('/change', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
            }
            // Verify current password
            const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            const bcrypt = require('bcryptjs');
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
            if (!isCurrentPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }
            // Validate new password strength
            const strength = passwordService.validatePasswordStrength(newPassword);
            if (!strength.isStrong) {
                return res.status(400).json({
                    success: false,
                    message: 'Password does not meet strength requirements',
                    data: {
                        strength
                    }
                });
            }
            // Check password history
            const wasUsedRecently = await passwordService.checkPasswordHistory(userId, newPassword);
            if (wasUsedRecently) {
                return res.status(400).json({
                    success: false,
                    message: 'Password was used recently. Please choose a different password'
                });
            }
            // Hash new password
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            // Update password
            await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
            // Add to password history
            await passwordService.addToPasswordHistory(userId, hashedPassword);
            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        }
        catch (error) {
            console.error('Password change error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change password'
            });
        }
    });
    /**
     * @route POST /auth/password/validate-strength
     * @desc Validate password strength
     */
    router.post('/validate-strength', async (req, res) => {
        try {
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password is required'
                });
            }
            const strength = passwordService.validatePasswordStrength(password);
            res.json({
                success: true,
                data: {
                    strength
                }
            });
        }
        catch (error) {
            console.error('Password strength validation error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to validate password strength'
            });
        }
    });
    /**
     * @route GET /auth/password/account-status
     * @desc Get account lockout status
     */
    router.get('/account-status', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const lockoutStatus = await passwordService.checkAccountLockout(userId);
            res.json({
                success: true,
                data: {
                    isLocked: lockoutStatus.isLocked,
                    remainingTime: lockoutStatus.remainingTime
                }
            });
        }
        catch (error) {
            console.error('Account status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get account status'
            });
        }
    });
    return router;
}
//# sourceMappingURL=password.js.map