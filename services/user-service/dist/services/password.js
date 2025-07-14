"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const auth_1 = require("../utils/auth");
class PasswordService {
    constructor(db) {
        this.db = db;
        this.emailTransporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || ''
            }
        });
    }
    validatePasswordStrength(password) {
        const feedback = [];
        let score = 0;
        if (password.length >= 8) {
            score += 1;
        }
        else {
            feedback.push('Password must be at least 8 characters long');
        }
        if (/[A-Z]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain at least one uppercase letter');
        }
        if (/[a-z]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain at least one lowercase letter');
        }
        if (/\d/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain at least one number');
        }
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain at least one special character');
        }
        return {
            score,
            feedback,
            isStrong: score >= 4
        };
    }
    async checkPasswordHistory(userId, password) {
        const result = await this.db.query('SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [userId]);
        for (const row of result.rows) {
            const isMatch = await bcryptjs_1.default.compare(password, row.password_hash);
            if (isMatch) {
                return true;
            }
        }
        return false;
    }
    async addToPasswordHistory(userId, passwordHash) {
        await this.db.query('INSERT INTO password_history (user_id, password_hash, created_at) VALUES ($1, $2, NOW())', [userId, passwordHash]);
    }
    async generatePasswordResetToken(userId) {
        const token = (0, auth_1.signJwt)({ userId, type: 'password-reset' });
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.db.query(`INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET token = $2, expires_at = $3`, [userId, token, expiresAt]);
        return token;
    }
    async verifyPasswordResetToken(token) {
        try {
            const result = await this.db.query(`SELECT user_id FROM password_reset_tokens 
         WHERE token = $1 AND expires_at > NOW() AND used = false`, [token]);
            if (result.rows.length === 0) {
                return null;
            }
            return result.rows[0].user_id;
        }
        catch (error) {
            console.error('Error verifying password reset token:', error);
            return null;
        }
    }
    async markPasswordResetTokenUsed(token) {
        await this.db.query('UPDATE password_reset_tokens SET used = true WHERE token = $1', [token]);
    }
    async sendPasswordResetEmail(email, resetUrl) {
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'noreply@authsystem.com',
            to: email,
            subject: 'Password Reset Request',
            html: `
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your password.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
        };
        await this.emailTransporter.sendMail(mailOptions);
    }
    async checkAccountLockout(userId) {
        const result = await this.db.query('SELECT locked_until FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return { isLocked: false };
        }
        const lockedUntil = result.rows[0].locked_until;
        if (!lockedUntil) {
            return { isLocked: false };
        }
        const now = new Date();
        const lockTime = new Date(lockedUntil);
        if (now < lockTime) {
            const remainingTime = Math.ceil((lockTime.getTime() - now.getTime()) / 1000);
            return { isLocked: true, remainingTime };
        }
        await this.db.query('UPDATE users SET locked_until = NULL, failed_attempts = 0 WHERE id = $1', [userId]);
        return { isLocked: false };
    }
    async incrementFailedAttempts(userId) {
        const result = await this.db.query('SELECT failed_attempts FROM users WHERE id = $1', [userId]);
        const currentAttempts = result.rows[0]?.failed_attempts || 0;
        const newAttempts = currentAttempts + 1;
        if (newAttempts >= 5) {
            const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
            await this.db.query('UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3', [newAttempts, lockUntil, userId]);
        }
        else {
            await this.db.query('UPDATE users SET failed_attempts = $1 WHERE id = $2', [newAttempts, userId]);
        }
    }
    async resetFailedAttempts(userId) {
        await this.db.query('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1', [userId]);
    }
}
exports.PasswordService = PasswordService;
exports.default = PasswordService;
//# sourceMappingURL=password.js.map