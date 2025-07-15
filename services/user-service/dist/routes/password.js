"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createPasswordRouter;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
function createPasswordRouter(passwordService) {
    const router = (0, express_1.Router)();
    router.post('/reset-request', [
        (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required')
    ], async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({
                    success: false,
                    error: 'Email is required'
                });
                return;
            }
            const result = await passwordService.requestPasswordReset(email);
            res.json({
                success: true,
                message: 'If the email exists, a password reset link has been sent'
            });
        }
        catch (error) {
            console.error('Error requesting password reset:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to request password reset'
            });
        }
    });
    router.post('/reset', [
        (0, express_validator_1.body)('token').notEmpty().withMessage('Token is required'),
        (0, express_validator_1.body)('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    ], async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            if (!token) {
                res.status(400).json({
                    success: false,
                    error: 'Token is required'
                });
                return;
            }
            if (!newPassword) {
                res.status(400).json({
                    success: false,
                    error: 'New password is required'
                });
                return;
            }
            const result = await passwordService.resetPassword(token, newPassword);
            if (result) {
                res.json({
                    success: true,
                    message: 'Password reset successfully'
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: 'Invalid or expired token'
                });
            }
        }
        catch (error) {
            console.error('Error resetting password:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to reset password'
            });
        }
    });
    router.post('/change', [
        (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password is required'),
        (0, express_validator_1.body)('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    ], async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
                return;
            }
            if (!currentPassword) {
                res.status(400).json({
                    success: false,
                    error: 'Current password is required'
                });
                return;
            }
            if (!newPassword) {
                res.status(400).json({
                    success: false,
                    error: 'New password is required'
                });
                return;
            }
            const result = await passwordService.changePassword(userId, currentPassword, newPassword);
            if (result) {
                res.json({
                    success: true,
                    message: 'Password changed successfully'
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: 'Current password is incorrect'
                });
            }
        }
        catch (error) {
            console.error('Error changing password:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to change password'
            });
        }
    });
    return router;
}
//# sourceMappingURL=password.js.map