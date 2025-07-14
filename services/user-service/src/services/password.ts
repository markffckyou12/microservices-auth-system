import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

export interface PasswordService {
  requestPasswordReset(email: string): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>;
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] };
  checkPasswordHistory(userId: string, newPassword: string): Promise<boolean>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
}

export class PasswordServiceImpl implements PasswordService {
  constructor(private db: Pool) {}

  async requestPasswordReset(email: string): Promise<boolean> {
    try {
      // Check if user exists
      const userResult = await this.db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        // Don't reveal if user exists or not
        return true;
      }

      const userId = userResult.rows[0].id;
      const token = this.generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await this.db.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [userId, token, expiresAt]
      );

      // Send email (in production, this would use a real email service)
      await this.sendPasswordResetEmail(email, token);

      return true;
    } catch (error) {
      console.error('Error requesting password reset:', error);
      return false;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      // Validate password strength
      const validation = this.validatePasswordStrength(newPassword);
      if (!validation.isValid) {
        throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
      }

      // Find valid token
      const tokenResult = await this.db.query(
        'SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = $1',
        [token]
      );

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

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      await this.db.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, resetToken.user_id]
      );

      // Mark token as used
      await this.db.query(
        'UPDATE password_reset_tokens SET used = true WHERE token = $1',
        [token]
      );

      // Add to password history
      await this.db.query(
        'INSERT INTO password_history (user_id, password_hash, created_at) VALUES ($1, $2, NOW())',
        [resetToken.user_id, hashedPassword]
      );

      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get current password hash
      const userResult = await this.db.query(
        'SELECT password FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const currentHash = userResult.rows[0].password;

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentHash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password strength
      const validation = this.validatePasswordStrength(newPassword);
      if (!validation.isValid) {
        throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
      }

      // Check password history
      const isPasswordReused = await this.checkPasswordHistory(userId, newPassword);
      if (isPasswordReused) {
        throw new Error('Password has been used recently');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await this.db.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, userId]
      );

      // Add to password history
      await this.db.query(
        'INSERT INTO password_history (user_id, password_hash, created_at) VALUES ($1, $2, NOW())',
        [userId, hashedPassword]
      );

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  }

  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

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

  async checkPasswordHistory(userId: string, newPassword: string): Promise<boolean> {
    try {
      // Get recent password history (last 5 passwords)
      const historyResult = await this.db.query(
        'SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
        [userId]
      );

      // Check if new password matches any recent password
      for (const row of historyResult.rows) {
        const isMatch = await bcrypt.compare(newPassword, row.password_hash);
        if (isMatch) {
          return true; // Password has been used recently
        }
      }

      return false; // Password is new
    } catch (error) {
      console.error('Error checking password history:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // In a real application, this would send an actual email
    // For now, we'll just log it
    console.log(`Password reset email sent to ${email} with token: ${token}`);
    
    // In production, you would use a service like SendGrid, AWS SES, etc.
    // await emailService.send({
    //   to: email,
    //   subject: 'Password Reset Request',
    //   html: `Click here to reset your password: ${process.env.FRONTEND_URL}/reset-password?token=${token}`
    // });
  }

  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
} 