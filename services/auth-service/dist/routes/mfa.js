"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createMFARoutes;
const express_1 = require("express");
const mfa_1 = __importDefault(require("../services/mfa"));
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
function createMFARoutes(db) {
    const mfaService = new mfa_1.default(db);
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
     * @route POST /auth/mfa/setup
     * @desc Setup TOTP for user
     */
    router.post('/setup', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            // Get user email for QR code
            const userResult = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            const email = userResult.rows[0].email;
            const mfaSecret = await mfaService.generateTOTPSecret(userId, email);
            res.json({
                success: true,
                message: 'MFA setup initiated',
                data: {
                    secret: mfaSecret.secret,
                    qrCode: mfaSecret.qrCode,
                    backupCodes: mfaSecret.backupCodes
                }
            });
        }
        catch (error) {
            console.error('MFA setup error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to setup MFA'
            });
        }
    });
    /**
     * @route POST /auth/mfa/enable
     * @desc Enable MFA for user
     */
    router.post('/enable', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const { secret, backupCodes } = req.body;
            if (!secret || !backupCodes) {
                return res.status(400).json({
                    success: false,
                    message: 'Secret and backup codes are required'
                });
            }
            await mfaService.storeMFASetup(userId, secret, backupCodes);
            res.json({
                success: true,
                message: 'MFA enabled successfully'
            });
        }
        catch (error) {
            console.error('MFA enable error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to enable MFA'
            });
        }
    });
    /**
     * @route POST /auth/mfa/verify
     * @desc Verify TOTP token
     */
    router.post('/verify', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token is required'
                });
            }
            // Get user's MFA secret
            const mfaResult = await db.query('SELECT secret FROM mfa_setup WHERE user_id = $1 AND is_enabled = true', [userId]);
            if (mfaResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'MFA not enabled for this user'
                });
            }
            const secret = mfaResult.rows[0].secret;
            const isValid = mfaService.verifyTOTPToken(secret, token);
            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid TOTP token'
                });
            }
            res.json({
                success: true,
                message: 'TOTP token verified successfully'
            });
        }
        catch (error) {
            console.error('MFA verify error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify TOTP token'
            });
        }
    });
    /**
     * @route POST /auth/mfa/verify-backup
     * @desc Verify backup code
     */
    router.post('/verify-backup', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const { code } = req.body;
            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Backup code is required'
                });
            }
            const isValid = await mfaService.verifyBackupCode(userId, code);
            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid backup code'
                });
            }
            res.json({
                success: true,
                message: 'Backup code verified successfully'
            });
        }
        catch (error) {
            console.error('MFA backup verify error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify backup code'
            });
        }
    });
    /**
     * @route POST /auth/mfa/sms/send
     * @desc Send SMS verification code
     */
    router.post('/sms/send', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const { phoneNumber } = req.body;
            if (!phoneNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number is required'
                });
            }
            const token = mfaService.generateSMSToken();
            await mfaService.storeSMSToken(userId, token);
            // TODO: Integrate with SMS service (Twilio, etc.)
            // For now, just return the token for testing
            res.json({
                success: true,
                message: 'SMS verification code sent',
                data: {
                    token: process.env.NODE_ENV === 'development' ? token : undefined
                }
            });
        }
        catch (error) {
            console.error('SMS send error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send SMS verification code'
            });
        }
    });
    /**
     * @route POST /auth/mfa/sms/verify
     * @desc Verify SMS code
     */
    router.post('/sms/verify', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'SMS token is required'
                });
            }
            const isValid = await mfaService.verifySMSToken(userId, token);
            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid SMS verification code'
                });
            }
            res.json({
                success: true,
                message: 'SMS verification code verified successfully'
            });
        }
        catch (error) {
            console.error('SMS verify error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify SMS code'
            });
        }
    });
    /**
     * @route GET /auth/mfa/status
     * @desc Get MFA status for user
     */
    router.get('/status', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const isEnabled = await mfaService.isMFAEnabled(userId);
            res.json({
                success: true,
                data: {
                    isEnabled
                }
            });
        }
        catch (error) {
            console.error('MFA status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get MFA status'
            });
        }
    });
    /**
     * @route DELETE /auth/mfa/disable
     * @desc Disable MFA for user
     */
    router.delete('/disable', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            await mfaService.disableMFA(userId);
            res.json({
                success: true,
                message: 'MFA disabled successfully'
            });
        }
        catch (error) {
            console.error('MFA disable error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to disable MFA'
            });
        }
    });
    return router;
}
//# sourceMappingURL=mfa.js.map