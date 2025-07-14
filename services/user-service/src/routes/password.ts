import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { body } from 'express-validator';
import PasswordService from '../services/password';
import { hashPassword, comparePassword } from '../utils/auth';

// Augment Express Request type for user
interface AuthenticatedUser {
  id: string;
}
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export default function createPasswordRoutes(db: Pool) {
  const router = Router();
  const passwordService = new PasswordService(db);

  // Request password reset
  router.post('/reset-request', [
    body('email').isEmail().normalizeEmail()
  ], async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        const userId = result.rows[0].id;
        const token = await passwordService.generatePasswordResetToken(userId);
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        await passwordService.sendPasswordResetEmail(email, resetUrl);
      }
      return res.json({ success: true, message: 'If an account with this email exists, a password reset link has been sent.' });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Reset password with token
  router.post('/reset', [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 })
  ], async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      const userId = await passwordService.verifyPasswordResetToken(token);
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Invalid or expired token' });
      }
      const strengthCheck = passwordService.validatePasswordStrength(newPassword);
      if (!strengthCheck.isStrong) {
        return res.status(400).json({ success: false, message: 'Password too weak', feedback: strengthCheck.feedback });
      }
      const wasUsedRecently = await passwordService.checkPasswordHistory(userId, newPassword);
      if (wasUsedRecently) {
        return res.status(400).json({ success: false, message: 'Password was used recently. Please choose a different password.' });
      }
      const hashedPassword = await hashPassword(newPassword);
      await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
      await passwordService.addToPasswordHistory(userId, hashedPassword);
      await passwordService.markPasswordResetTokenUsed(token);
      return res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      console.error('Error resetting password:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Change password (authenticated user)
  router.post('/change', [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 })
  ], async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const { currentPassword, newPassword } = req.body;
      const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const isValid = await comparePassword(currentPassword, result.rows[0].password_hash);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      const strengthCheck = passwordService.validatePasswordStrength(newPassword);
      if (!strengthCheck.isStrong) {
        return res.status(400).json({ success: false, message: 'Password too weak', feedback: strengthCheck.feedback });
      }
      const wasUsedRecently = await passwordService.checkPasswordHistory(userId, newPassword);
      if (wasUsedRecently) {
        return res.status(400).json({ success: false, message: 'Password was used recently. Please choose a different password.' });
      }
      const hashedPassword = await hashPassword(newPassword);
      await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
      await passwordService.addToPasswordHistory(userId, hashedPassword);
      return res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  return router;
} 