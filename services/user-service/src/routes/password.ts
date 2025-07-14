import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { PasswordService } from '../services/password';

// Augment Express Request type for user
interface AuthenticatedUser {
  id: string;
  email: string;
  roles?: string[];
}
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export default function createPasswordRouter(passwordService: PasswordService): Router {
  const router = Router();

  // Request password reset
  router.post('/reset-request', [
    body('email').isEmail().withMessage('Valid email is required')
  ], async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const result = await passwordService.requestPasswordReset(email);
      
      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to request password reset'
      });
    }
  });

  // Reset password with token
  router.post('/reset', [
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ], async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token is required'
        });
      }

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          error: 'New password is required'
        });
      }

      const result = await passwordService.resetPassword(token, newPassword);
      
      if (result) {
        res.json({
          success: true,
          message: 'Password reset successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset password'
      });
    }
  });

  // Change password (requires authentication)
  router.post('/change', [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ], async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password is required'
        });
      }

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          error: 'New password is required'
        });
      }

      const result = await passwordService.changePassword(userId, currentPassword, newPassword);
      
      if (result) {
        res.json({
          success: true,
          message: 'Password changed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  });

  return router;
} 