import { Router, Request, Response } from 'express';
import { AuditService, AuditFilters, SecurityEventFilters } from '../services/audit';

export function createAuditRouter(auditService: AuditService): Router {
  const router = Router();

  // Middleware to validate request parameters
  const validateRequest = (req: Request, res: Response, next: Function) => {
    const { user_id, action, resource, start_date, end_date, limit, offset } = req.query;
    
    if (user_id && typeof user_id !== 'string') {
      return res.status(400).json({ error: 'user_id must be a string' });
    }
    
    if (action && typeof action !== 'string') {
      return res.status(400).json({ error: 'action must be a string' });
    }
    
    if (resource && typeof resource !== 'string') {
      return res.status(400).json({ error: 'resource must be a string' });
    }
    
    if (start_date && typeof start_date !== 'string') {
      return res.status(400).json({ error: 'start_date must be a string' });
    }
    
    if (end_date && typeof end_date !== 'string') {
      return res.status(400).json({ error: 'end_date must be a string' });
    }
    
    if (limit && (typeof limit !== 'string' || isNaN(parseInt(limit)))) {
      return res.status(400).json({ error: 'limit must be a valid number' });
    }
    
    if (offset && (typeof offset !== 'string' || isNaN(parseInt(offset)))) {
      return res.status(400).json({ error: 'offset must be a valid number' });
    }
    
    next();
  };

  // Get audit logs with filters
  router.get('/logs', validateRequest, async (req: Request, res: Response) => {
    try {
      const { user_id, action, resource, start_date, end_date, limit, offset } = req.query;
      
      const filters: AuditFilters = {
        userId: user_id as string,
        action: action as string,
        resource: resource as string,
        startDate: start_date ? new Date(start_date as string) : undefined,
        endDate: end_date ? new Date(end_date as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const logs = await auditService.getAuditLogs(filters);
      
      res.json({
        success: true,
        data: logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit logs'
      });
    }
  });

  // Get security events with filters
  router.get('/security-events', validateRequest, async (req: Request, res: Response) => {
    try {
      const { event_type, severity, start_date, end_date, limit, offset } = req.query;
      
      const filters: SecurityEventFilters = {
        event_type: event_type as string,
        severity: severity as string,
        start_date: start_date as string,
        end_date: end_date as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const events = await auditService.getSecurityEvents(filters);
      
      res.json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      console.error('Error fetching security events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch security events'
      });
    }
  });

  // Get audit summary
  router.get('/summary', validateRequest, async (req: Request, res: Response) => {
    try {
      const { user_id, start_date, end_date } = req.query;
      
      const filters: AuditFilters = {
        userId: user_id as string,
        startDate: start_date ? new Date(start_date as string) : undefined,
        endDate: end_date ? new Date(end_date as string) : undefined
      };

      const summary = await auditService.getAuditSummary(filters);
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching audit summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit summary'
      });
    }
  });

  // Get security summary
  router.get('/security-summary', validateRequest, async (req: Request, res: Response) => {
    try {
      const { event_type, severity, start_date, end_date } = req.query;
      
      const filters: SecurityEventFilters = {
        event_type: event_type as string,
        severity: severity as string,
        start_date: start_date as string,
        end_date: end_date as string
      };

      const summary = await auditService.getSecuritySummary(filters);
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching security summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch security summary'
      });
    }
  });

  // Get user activity
  router.get('/user-activity/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const activity = await auditService.getUserActivity(userId);
      
      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user activity'
      });
    }
  });

  // Generate compliance report
  router.post('/compliance-report', async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required'
        });
      }

      const report = await auditService.generateComplianceReport(
        new Date(startDate),
        new Date(endDate)
      );
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error generating compliance report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate compliance report'
      });
    }
  });

  return router;
} 