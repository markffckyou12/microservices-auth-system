import { Router, Request, Response } from 'express';
import { AuditService } from '../services/audit';
import { AuthenticatedRequest } from '../middleware/authorization';

export function setupAuditRoutes(auditService: AuditService) {
  const router = Router();

  // Validation middleware
  const validateRequest = (req: Request, res: Response, next: Function) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required'
      });
    }
    next();
  };

  // Get audit logs with filtering
  router.get('/logs', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { user_id, action, resource, start_date, end_date, limit = 50, offset = 0 } = req.query;
      
      const logs = await auditService.getAuditLogs({
        user_id: user_id as string,
        action: action as string,
        resource: resource as string,
        start_date: start_date as string,
        end_date: end_date as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({
        success: true,
        data: logs,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: logs.length
        }
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs'
      });
    }
  });

  // Get security events
  router.get('/security-events', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { event_type, severity, start_date, end_date, limit = 50, offset = 0 } = req.query;
      
      const events = await auditService.getSecurityEvents({
        event_type: event_type as string,
        severity: severity as string,
        start_date: start_date as string,
        end_date: end_date as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({
        success: true,
        data: events,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: events.length
        }
      });
    } catch (error) {
      console.error('Error fetching security events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch security events'
      });
    }
  });

  // Get audit summary
  router.get('/summary', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { start_date, end_date } = req.query;
      
      const summary = await auditService.getAuditSummary({
        start_date: start_date as string,
        end_date: end_date as string
      });

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching audit summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit summary'
      });
    }
  });

  return router;
} 