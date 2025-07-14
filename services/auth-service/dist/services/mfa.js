"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MFAService = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
class MFAService {
    constructor(db) {
        this.db = db;
    }
    /**
     * Generate TOTP secret and QR code for user
     */
    async generateTOTPSecret(userId, email) {
        const secret = speakeasy_1.default.generateSecret({
            name: `Auth System (${email})`,
            issuer: 'Auth System',
            length: 32
        });
        const qrCode = await qrcode_1.default.toDataURL(secret.otpauth_url || '');
        const backupCodes = this.generateBackupCodes();
        return {
            secret: secret.base32 || '',
            qrCode,
            backupCodes
        };
    }
    /**
     * Verify TOTP token
     */
    verifyTOTPToken(secret, token) {
        return speakeasy_1.default.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2 // Allow 2 time steps tolerance
        });
    }
    /**
     * Generate backup codes
     */
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(speakeasy_1.default.generateSecret({ length: 8 }).base32?.substring(0, 8) || '');
        }
        return codes;
    }
    /**
     * Verify backup code
     */
    verifyBackupCode(userId, code) {
        return new Promise(async (resolve) => {
            try {
                const result = await this.db.query('SELECT backup_codes FROM mfa_setup WHERE user_id = $1 AND is_enabled = true', [userId]);
                if (result.rows.length === 0) {
                    resolve(false);
                    return;
                }
                const backupCodes = result.rows[0].backup_codes || [];
                const isValid = backupCodes.includes(code);
                if (isValid) {
                    // Remove used backup code
                    const updatedCodes = backupCodes.filter((c) => c !== code);
                    await this.db.query('UPDATE mfa_setup SET backup_codes = $1 WHERE user_id = $2', [updatedCodes, userId]);
                }
                resolve(isValid);
            }
            catch (error) {
                console.error('Error verifying backup code:', error);
                resolve(false);
            }
        });
    }
    /**
     * Generate SMS token
     */
    generateSMSToken() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    /**
     * Store MFA setup in database
     */
    async storeMFASetup(userId, secret, backupCodes) {
        await this.db.query(`INSERT INTO mfa_setup (user_id, secret, backup_codes, is_enabled, created_at)
       VALUES ($1, $2, $3, true, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         secret = $2, 
         backup_codes = $3, 
         is_enabled = true, 
         updated_at = NOW()`, [userId, secret, backupCodes]);
    }
    /**
     * Check if MFA is enabled for user
     */
    async isMFAEnabled(userId) {
        const result = await this.db.query('SELECT is_enabled FROM mfa_setup WHERE user_id = $1', [userId]);
        return result.rows.length > 0 && result.rows[0].is_enabled;
    }
    /**
     * Disable MFA for user
     */
    async disableMFA(userId) {
        await this.db.query('UPDATE mfa_setup SET is_enabled = false, updated_at = NOW() WHERE user_id = $1', [userId]);
    }
    /**
     * Store SMS token
     */
    async storeSMSToken(userId, token) {
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await this.db.query(`INSERT INTO mfa_tokens (user_id, token, type, expires_at)
       VALUES ($1, $2, 'sms', $3)`, [userId, token, expiresAt]);
    }
    /**
     * Verify SMS token
     */
    async verifySMSToken(userId, token) {
        const result = await this.db.query(`SELECT * FROM mfa_tokens 
       WHERE user_id = $1 AND token = $2 AND type = 'sms' 
       AND expires_at > NOW() AND used = false`, [userId, token]);
        if (result.rows.length === 0) {
            return false;
        }
        // Mark token as used
        await this.db.query('UPDATE mfa_tokens SET used = true WHERE user_id = $1 AND token = $2', [userId, token]);
        return true;
    }
}
exports.MFAService = MFAService;
exports.default = MFAService;
//# sourceMappingURL=mfa.js.map