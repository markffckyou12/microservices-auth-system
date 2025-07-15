"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordServiceImpl = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
class PasswordServiceImpl {
    constructor(db) {
        this.db = db;
    }
    async requestPasswordReset(email) {
        try {
            const userResult = await this.db.query('SELECT id FROM users WHERE email = $1', [email]);
            if (userResult.rows.length === 0) {
                return true;
            }
            const userId = userResult.rows[0].id;
            const token = await this.generatePasswordResetToken(userId);
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
            await this.db.query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [userId, token, expiresAt]);
            await this.sendPasswordResetEmail(email, token);
            return true;
        }
        catch (error) {
            console.error('Error requesting password reset:', error);
            return false;
        }
    }
    async resetPassword(token, newPassword) {
        try {
            const validation = this.validatePasswordStrength(newPassword);
            if (!validation.isValid) {
                throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
            }
            const tokenResult = await this.db.query('SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = $1', [token]);
            if (tokenResult.rows.length === 0) {
                throw new Error('Invalid reset token');
            }
            const resetToken = tokenResult.rows[0];
            if (resetToken.used) {
                throw new Error('Token already used');
            }
            if (new Date() > new Date(resetToken.expires_at)) {
                throw new Error('Token expired');
            }
            const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
            await this.db.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, resetToken.user_id]);
            await this.db.query('UPDATE password_reset_tokens SET used = true WHERE token = $1', [token]);
            await this.db.query('INSERT INTO password_history (user_id, password_hash, created_at) VALUES ($1, $2, NOW())', [resetToken.user_id, hashedPassword]);
            return true;
        }
        catch (error) {
            console.error('Error resetting password:', error);
            return false;
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const userResult = await this.db.query('SELECT password FROM users WHERE id = $1', [userId]);
            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }
            const currentHash = userResult.rows[0].password;
            const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, currentHash);
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }
            const validation = this.validatePasswordStrength(newPassword);
            if (!validation.isValid) {
                throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
            }
            const isPasswordReused = await this.checkPasswordHistory(userId, newPassword);
            if (isPasswordReused) {
                throw new Error('Password has been used recently');
            }
            const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
            await this.db.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
            await this.db.query('INSERT INTO password_history (user_id, password_hash, created_at) VALUES ($1, $2, NOW())', [userId, hashedPassword]);
            return true;
        }
        catch (error) {
            console.error('Error changing password:', error);
            return false;
        }
    }
    validatePasswordStrength(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    async checkPasswordHistory(userId, newPassword) {
        try {
            const historyResult = await this.db.query('SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [userId]);
            for (const row of historyResult.rows) {
                const isMatch = await bcryptjs_1.default.compare(newPassword, row.password_hash);
                if (isMatch) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('Error checking password history:', error);
            return false;
        }
    }
    async sendPasswordResetEmail(email, token) {
        console.log(`Password reset email sent to ${email} with token: ${token}`);
    }
    async generatePasswordResetToken(userId) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        return token;
    }
    generateResetToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
}
exports.PasswordServiceImpl = PasswordServiceImpl;
//# sourceMappingURL=password.js.map