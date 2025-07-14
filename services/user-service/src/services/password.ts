import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { Pool } from 'pg';
import { signJwt } from '../utils/auth';

export interface PasswordResetToken {
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
}

export interface PasswordHistory {
  userId: string;
  passwordHash: string;
  createdAt: Date;
}

export interface PasswordStrength {
  score: number;
  feedback: string[];
  isStrong: boolean;
}

export class PasswordService {
  private db: Pool;
  private emailTransporter: nodemailer.Transporter;

  constructor(db: Pool) {
    this.db = db;
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });
  }

  /**
   * Validate password strength
   */
  public validatePasswordStrength(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one number');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one special character');
    }

    return {
      score,
      feedback,
      isStrong: score >= 4
    };
  }

  /**
   * Check if password was used recently
   */
  public async checkPasswordHistory(userId: string, password: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [userId]
    );

    for (const row of result.rows) {
      const isMatch = await bcrypt.compare(password, row.password_hash);
      if (isMatch) {
        return true; // Password was used recently
      }
    }

    return false;
  }

  /**
   * Add password to history
   */
  public async addToPasswordHistory(userId: string, passwordHash: string): Promise<void> {
    await this.db.query(
      'INSERT INTO password_history (user_id, password_hash, created_at) VALUES ($1, $2, NOW())',
      [userId, passwordHash]
    );
  }

  /**
   * Generate password reset token
   */
  public async generatePasswordResetToken(userId: string): Promise<string> {
    const token = signJwt({ userId, type: 'password-reset' });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET token = $2, expires_at = $3`,
      [userId, token, expiresAt]
    );

    return token;
  }

  /**
   * Verify password reset token
   */
  public async verifyPasswordResetToken(token: string): Promise<string | null> {
    try {
      const result = await this.db.query(
        `SELECT user_id FROM password_reset_tokens 
         WHERE token = $1 AND expires_at > NOW() AND used = false`,
        [token]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].user_id;
    } catch (error) {
      console.error('Error verifying password reset token:', error);
      return null;
    }
  }

  /**
   * Mark password reset token as used
   */
  public async markPasswordResetTokenUsed(token: string): Promise<void> {
    await this.db.query(
      'UPDATE password_reset_tokens SET used = true WHERE token = $1',
      [token]
    );
  }

  /**
   * Send password reset email
   */
  public async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
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

  /**
   * Check account lockout status
   */
  public async checkAccountLockout(userId: string): Promise<{ isLocked: boolean; remainingTime?: number }> {
    const result = await this.db.query(
      'SELECT locked_until FROM users WHERE id = $1',
      [userId]
    );

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

    // Unlock account if lock time has passed
    await this.db.query(
      'UPDATE users SET locked_until = NULL, failed_attempts = 0 WHERE id = $1',
      [userId]
    );

    return { isLocked: false };
  }

  /**
   * Increment failed login attempts
   */
  public async incrementFailedAttempts(userId: string): Promise<void> {
    const result = await this.db.query(
      'SELECT failed_attempts FROM users WHERE id = $1',
      [userId]
    );

    const currentAttempts = result.rows[0]?.failed_attempts || 0;
    const newAttempts = currentAttempts + 1;

    if (newAttempts >= 5) {
      // Lock account for 30 minutes
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      await this.db.query(
        'UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3',
        [newAttempts, lockUntil, userId]
      );
    } else {
      await this.db.query(
        'UPDATE users SET failed_attempts = $1 WHERE id = $2',
        [newAttempts, userId]
      );
    }
  }

  /**
   * Reset failed login attempts
   */
  public async resetFailedAttempts(userId: string): Promise<void> {
    await this.db.query(
      'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1',
      [userId]
    );
  }
}

export default PasswordService; 