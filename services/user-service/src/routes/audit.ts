import { Router, Request, Response } from 'express';
import { AuditService, AuditFilters } from '../services/audit';

export function createAuditRouter(auditService: AuditService): Router {
  const router = Router();

  // Middleware to validate request parameters
  const validateRequest = (req: Request, res: Response, next: Function): void => {
    const { user_id, event_type, action, resource_type, start_date, end_date, limit, offset } = req.query;
    
    if (user_id && typeof user_id !== 'string') {
      res.status(400).json({ error: 'user_id must be a string' });
      return;
    }
    
    if (event_type && typeof event_type !== 'string') {
      res.status(400).json({ error: 'event_type must be a string' });
      return;
    }
    
    if (action && typeof action !== 'string') {
      res.status(400).json({ error: 'action must be a string' });
      return;
    }
    
    if (resource_type && typeof resource_type !== 'string') {
      res.status(400).json({ error: 'resource_type must be a string' });
      return;
    }
    
    if (start_date && typeof start_date !== 'string') {
      res.status(400).json({ error: 'start_date must be a string' });
      return;
    }
    
    if (end_date && typeof end_date !== 'string') {
      res.status(400).json({ error: 'end_date must be a string' });
      return;
    }
    
    if (limit && (typeof limit !== 'string' || isNaN(parseInt(limit)))) {
      res.status(400).json({ error: 'limit must be a valid number' });
      return;
    }
    
    if (offset && (typeof offset !== 'string' || isNaN(parseInt(offset)))) {
      res.status(400).json({ error: 'offset must be a valid number' });
      return;
    }
    
    next();
  };

  // Add missing routes that were returning "Route not found" - these must come BEFORE /logs
  
  // Get audit logs by user ID
  router.get('/logs/user/:userId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      const filters: AuditFilters = {
        userId: userId
      };

      const logs = await auditService.getAuditLogs(filters);
      
      res.json({
        success: true,
        data: logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user audit logs'
      });
    }
  });

  // Get audit logs by action
  router.get('/logs/action/:action', async (req: Request, res: Response): Promise<void> => {
    try {
      const { action } = req.params;
      
      const filters: AuditFilters = {
        action: action
      };

      const logs = await auditService.getAuditLogs(filters);
      
      res.json({
        success: true,
        data: logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Error fetching action audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch action audit logs'
      });
    }
  });

  // Get audit logs by resource
  router.get('/logs/resource/:resource', async (req: Request, res: Response): Promise<void> => {
    try {
      const { resource } = req.params;
      
      const filters: AuditFilters = {
        resourceType: resource
      };

      const logs = await auditService.getAuditLogs(filters);
      
      res.json({
        success: true,
        data: logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Error fetching resource audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch resource audit logs'
      });
    }
  });

  // Get audit logs by date range
  router.get('/logs/date-range', validateRequest, async (req: Request, res: Response): Promise<void> => {
    try {
      const { start_date, end_date, user_id, action, resource_type, limit, offset } = req.query;
      
      if (!start_date || !end_date) {
        res.status(400).json({
          success: false,
          error: 'start_date and end_date are required'
        });
        return;
      }
      
      const filters: AuditFilters = {
        userId: user_id as string,
        action: action as string,
        resourceType: resource_type as string,
        startDate: new Date(start_date as string),
        endDate: new Date(end_date as string),
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const logs = await auditService.getAuditLogs(filters);
      
      res.json({
        success: true,
        data: logs,
        count: logs.length,
        dateRange: {
          start: start_date,
          end: end_date
        }
      });
    } catch (error) {
      console.error('Error fetching date range audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch date range audit logs'
      });
    }
  });

  // Get audit logs with filters
  router.get('/logs', validateRequest, async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, event_type, action, resource_type, start_date, end_date, limit, offset } = req.query;
      
      const filters: AuditFilters = {
        userId: user_id as string,
        eventType: event_type as string,
        action: action as string,
        resourceType: resource_type as string,
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

  // Get audit log by ID
  router.get('/logs/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const log = await auditService.getAuditLogById(id);
      
      if (!log) {
        res.status(404).json({
          success: false,
          error: 'Audit log not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: log
      });
    } catch (error) {
      console.error('Error fetching audit log:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit log'
      });
    }
  });

  // Get audit summary
  router.get('/summary', validateRequest, async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, event_type, start_date, end_date, limit } = req.query;
      
      const filters: AuditFilters = {
        userId: user_id as string,
        eventType: event_type as string,
        startDate: start_date ? new Date(start_date as string) : undefined,
        endDate: end_date ? new Date(end_date as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
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

  // Get user activity
  router.get('/user-activity/:userId', async (req: Request, res: Response): Promise<void> => {
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
  router.post('/compliance-report', async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.body;
      
      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate and endDate are required'
        });
        return;
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

  // Export audit logs
  router.post('/export', validateRequest, async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, event_type, action, resource_type, start_date, end_date } = req.body;
      
      const filters: AuditFilters = {
        userId: user_id as string,
        eventType: event_type as string,
        action: action as string,
        resourceType: resource_type as string,
        startDate: start_date ? new Date(start_date as string) : undefined,
        endDate: end_date ? new Date(end_date as string) : undefined
      };

      const logs = await auditService.exportAuditLogs(filters);
      
      res.json({
        success: true,
        data: logs,
        count: logs.length,
        exportDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export audit logs'
      });
    }
  });

  // Get events by type
  router.get('/events/:eventType', validateRequest, async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventType } = req.params;
      const { user_id, action, resource_type, start_date, end_date, limit, offset } = req.query;
      
      const filters: AuditFilters = {
        userId: user_id as string,
        eventType,
        action: action as string,
        resourceType: resource_type as string,
        startDate: start_date ? new Date(start_date as string) : undefined,
        endDate: end_date ? new Date(end_date as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const logs = await auditService.getAuditLogs(filters);
      
      res.json({
        success: true,
        data: logs,
        count: logs.length,
        eventType
      });
    } catch (error) {
      console.error('Error fetching events by type:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch events by type'
      });
    }
  });



  return router;
} 