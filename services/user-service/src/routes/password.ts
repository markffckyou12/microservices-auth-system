import { Router, Request, Response } from 'express';
import { PasswordService } from '../services/password';
import { AuthenticatedRequest } from '../middleware/authorization';

export function setupPasswordRoutes(passwordService: PasswordService) {
  const router = Router();

  // Extend Request interface for password routes
  interface PasswordRequest extends Request {
    user?: {
      id: string;
      email: string;
    };
  }

  // Request password reset
  router.post('/reset-request', async (req: PasswordRequest, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const result = await passwordService.requestPasswordReset(email);
      
      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to request password reset'
      });
    }
  });

  // Reset password with token
  router.post('/reset', async (req: PasswordRequest, res: Response) => {
    try {
      const { token, new_password } = req.body;
      
      if (!token || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required'
        });
      }

      const result = await passwordService.resetPassword(token, new_password);
      
      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password'
      });
    }
  });

  // Change password for authenticated user
  router.post('/change', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { current_password, new_password } = req.body;
      
      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await passwordService.changePassword(
        req.user.id,
        current_password,
        new_password
      );
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  });

  return router;
} 