import { Router, Request, Response } from 'express';
import { query, param, validationResult } from 'express-validator';
import { AuditService } from '../services/audit';
import { AuthorizationMiddleware } from '../middleware/authorization';
import { AuthenticatedRequest } from '../middleware/authorization';

export function createAuditRouter(auditService: AuditService, authMiddleware: AuthorizationMiddleware) {
  const router = Router();

  // Validation middleware
  const validateRequest = (req: Request, res: Response, next: Function) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    next();
  };

  // Audit Log Routes
  router.get('/logs',
    [
      query('userId').optional().isUUID().withMessage('Invalid user ID'),
      query('action').optional().isString().trim(),
      query('startDate').optional().isISO8601().withMessage('Invalid start date'),
      query('endDate').optional().isISO8601().withMessage('Invalid end date'),
      query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
      query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
    ],
    validateRequest,
    authMiddleware.requirePermission({ resource: 'audit_logs', action: 'read' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const {
          userId,
          action,
          startDate,
          endDate,
          limit = 100,
          offset = 0
        } = req.query;

        const logs = await auditService.getAuditLog(
          userId as string,
          action as string,
          startDate ? new Date(startDate as string) : undefined,
          endDate ? new Date(endDate as string) : undefined
        );

        // Apply pagination
        const paginatedLogs = logs.slice(offset as number, (offset as number) + (limit as number));

        res.json({
          logs: paginatedLogs,
          pagination: {
            total: logs.length,
            limit: limit as number,
            offset: offset as number,
            hasMore: (offset as number) + (limit as number) < logs.length
          }
        });
      } catch (error) {
        console.error('Error getting audit logs:', error);
        res.status(500).json({ error: 'Failed to get audit logs' });
      }
    }
  );

  router.get('/logs/:userId',
    [
      param('userId').isUUID().withMessage('Invalid user ID'),
      query('action').optional().isString().trim(),
      query('startDate').optional().isISO8601().withMessage('Invalid start date'),
      query('endDate').optional().isISO8601().withMessage('Invalid end date')
    ],
    validateRequest,
    authMiddleware.requireOwnershipOrPermission('audit_logs', 'read'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { action, startDate, endDate } = req.query;

        const logs = await auditService.getAuditLog(
          req.params.userId,
          action as string,
          startDate ? new Date(startDate as string) : undefined,
          endDate ? new Date(endDate as string) : undefined
        );

        res.json({ logs });
      } catch (error) {
        console.error('Error getting user audit logs:', error);
        res.status(500).json({ error: 'Failed to get user audit logs' });
      }
    }
  );

  // Security Events Routes
  router.get('/security-events',
    [
      query('eventType').optional().isString().trim(),
      query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
      query('startDate').optional().isISO8601().withMessage('Invalid start date'),
      query('endDate').optional().isISO8601().withMessage('Invalid end date'),
      query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
      query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
    ],
    validateRequest,
    authMiddleware.requirePermission({ resource: 'security_events', action: 'read' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const {
          eventType,
          severity,
          startDate,
          endDate,
          limit = 100,
          offset = 0
        } = req.query;

        const events = await auditService.getSecurityEvents(
          eventType as string,
          severity as string,
          startDate ? new Date(startDate as string) : undefined,
          endDate ? new Date(endDate as string) : undefined
        );

        // Apply pagination
        const paginatedEvents = events.slice(offset as number, (offset as number) + (limit as number));

        res.json({
          events: paginatedEvents,
          pagination: {
            total: events.length,
            limit: limit as number,
            offset: offset as number,
            hasMore: (offset as number) + (limit as number) < events.length
          }
        });
      } catch (error) {
        console.error('Error getting security events:', error);
        res.status(500).json({ error: 'Failed to get security events' });
      }
    }
  );

  // Compliance Report Routes
  router.get('/compliance-report',
    [
      query('startDate').isISO8601().withMessage('Start date is required and must be valid ISO date'),
      query('endDate').isISO8601().withMessage('End date is required and must be valid ISO date')
    ],
    validateRequest,
    authMiddleware.requirePermission({ resource: 'compliance_reports', action: 'read' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { startDate, endDate } = req.query;

        const report = await auditService.generateComplianceReport(
          new Date(startDate as string),
          new Date(endDate as string)
        );

        res.json({
          message: 'Compliance report generated successfully',
          report
        });
      } catch (error) {
        console.error('Error generating compliance report:', error);
        res.status(500).json({ error: 'Failed to generate compliance report' });
      }
    }
  );

  // Security Event Statistics
  router.get('/security-stats',
    [
      query('startDate').optional().isISO8601().withMessage('Invalid start date'),
      query('endDate').optional().isISO8601().withMessage('Invalid end date')
    ],
    validateRequest,
    authMiddleware.requirePermission({ resource: 'security_stats', action: 'read' }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { startDate, endDate } = req.query;

        const events = await auditService.getSecurityEvents(
          undefined,
          undefined,
          startDate ? new Date(startDate as string) : undefined,
          endDate ? new Date(endDate as string) : undefined
        );

        // Calculate statistics
        const stats = {
          total: events.length,
          bySeverity: {
            low: events.filter(e => e.severity === 'low').length,
            medium: events.filter(e => e.severity === 'medium').length,
            high: events.filter(e => e.severity === 'high').length,
            critical: events.filter(e => e.severity === 'critical').length
          },
          byType: events.reduce((acc, event) => {
            acc[event.event_type] = (acc[event.event_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          recentEvents: events.slice(0, 10) // Last 10 events
        };

        res.json({ stats });
      } catch (error) {
        console.error('Error getting security statistics:', error);
        res.status(500).json({ error: 'Failed to get security statistics' });
      }
    }
  );

  // User Activity Summary
  router.get('/user-activity/:userId',
    [
      param('userId').isUUID().withMessage('Invalid user ID'),
      query('startDate').optional().isISO8601().withMessage('Invalid start date'),
      query('endDate').optional().isISO8601().withMessage('Invalid end date')
    ],
    validateRequest,
    authMiddleware.requireOwnershipOrPermission('user_activity', 'read'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { startDate, endDate } = req.query;

        const logs = await auditService.getAuditLog(
          req.params.userId,
          undefined,
          startDate ? new Date(startDate as string) : undefined,
          endDate ? new Date(endDate as string) : undefined
        );

        // Calculate user activity summary
        const activity = {
          totalActions: logs.length,
          byAction: logs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          byResource: logs.reduce((acc, log) => {
            acc[log.resource] = (acc[log.resource] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          recentActivity: logs.slice(0, 20), // Last 20 actions
          firstAction: logs.length > 0 ? logs[logs.length - 1].created_at : null,
          lastAction: logs.length > 0 ? logs[0].created_at : null
        };

        res.json({ activity });
      } catch (error) {
        console.error('Error getting user activity:', error);
        res.status(500).json({ error: 'Failed to get user activity' });
      }
    }
  );

  return router;
} 