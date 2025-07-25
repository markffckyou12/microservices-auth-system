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
  ], async (req: Request, res: Response): Promise<void> => {
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
  ], async (req: Request, res: Response): Promise<void> => {
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

  // Reset password confirm (alias for /reset)
  router.post('/reset-confirm', [
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ], async (req: Request, res: Response): Promise<void> => {
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
  ], async (req: Request, res: Response): Promise<void> => {
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