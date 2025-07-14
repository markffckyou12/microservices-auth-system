import { AuditServiceImpl } from '../../src/services/audit';
import { Pool } from 'pg';

// Mock pg module
jest.mock('pg', () => ({
  Pool: jest.fn()
}));

describe('Audit Service', () => {
  let auditService: AuditServiceImpl;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    // Create mock pool
    mockPool = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      listeners: jest.fn(),
      listenerCount: jest.fn(),
      eventNames: jest.fn(),
      addListener: jest.fn(),
      once: jest.fn(),
      prependListener: jest.fn(),
      prependOnceListener: jest.fn(),
      setMaxListeners: jest.fn(),
      getMaxListeners: jest.fn(),
      rawListeners: jest.fn(),
      emit: jest.fn()
    } as any;

    auditService = new AuditServiceImpl(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Audit Log Management', () => {
    it('should log an action successfully', async () => {
      const mockAuditLog = {
        id: 'log-1',
        user_id: 'user-1',
        action: 'read_users',
        resource: 'users',
        resource_id: 'user-1',
        details: { method: 'GET', path: '/api/users' },
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        created_at: new Date()
      };

      mockPool.query.mockResolvedValue({
        rows: [mockAuditLog]
      });

      const result = await auditService.logAction({
        user_id: 'user-1',
        action: 'read_users',
        resource: 'users',
        resource_id: 'user-1',
        details: { method: 'GET', path: '/api/users' },
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0'
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        ['user-1', 'read_users', 'users', 'user-1', '{"method":"GET","path":"/api/users"}', '127.0.0.1', 'Mozilla/5.0']
      );
      expect(result).toEqual(mockAuditLog);
    });

    it('should get audit logs with filters', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          user_id: 'user-1',
          action: 'read_users',
          resource: 'users',
          resource_id: 'user-1',
          details: '{"method":"GET","path":"/api/users"}',
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0',
          created_at: new Date()
        }
      ];

      mockPool.query.mockResolvedValue({
        rows: mockLogs
      });

      const result = await auditService.getAuditLog('user-1', 'read_users');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM audit_logs WHERE 1=1'),
        ['user-1', 'read_users']
      );
      expect(result).toHaveLength(1);
      expect(result[0].details).toEqual({ method: 'GET', path: '/api/users' });
    });

    it('should get audit logs without filters', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          user_id: 'user-1',
          action: 'read_users',
          resource: 'users',
          resource_id: 'user-1',
          details: '{"method":"GET","path":"/api/users"}',
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0',
          created_at: new Date()
        }
      ];

      mockPool.query.mockResolvedValue({
        rows: mockLogs
      });

      const result = await auditService.getAuditLog();

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM audit_logs WHERE 1=1 ORDER BY created_at DESC',
        []
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('Security Event Management', () => {
    it('should log a security event successfully', async () => {
      const mockSecurityEvent = {
        id: 'event-1',
        event_type: 'permission_denied',
        user_id: 'user-1',
        details: { reason: 'Insufficient permissions' },
        severity: 'medium',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        created_at: new Date()
      };

      mockPool.query.mockResolvedValue({
        rows: [mockSecurityEvent]
      });

      const result = await auditService.logSecurityEvent({
        event_type: 'permission_denied',
        user_id: 'user-1',
        details: { reason: 'Insufficient permissions' },
        severity: 'medium',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0'
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO security_events'),
        ['permission_denied', 'user-1', '{"reason":"Insufficient permissions"}', 'medium', '127.0.0.1', 'Mozilla/5.0']
      );
      expect(result).toEqual(mockSecurityEvent);
    });

    it('should get security events with filters', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          event_type: 'permission_denied',
          user_id: 'user-1',
          details: '{"reason":"Insufficient permissions"}',
          severity: 'medium',
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0',
          created_at: new Date()
        }
      ];

      mockPool.query.mockResolvedValue({
        rows: mockEvents
      });

      const result = await auditService.getSecurityEvents('permission_denied', 'medium');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM security_events WHERE 1=1'),
        ['permission_denied', 'medium']
      );
      expect(result).toHaveLength(1);
      expect(result[0].details).toEqual({ reason: 'Insufficient permissions' });
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate compliance report', async () => {
      const mockAuditSummary = [
        { action: 'read_users', count: '10', unique_users: '5' },
        { action: 'update_users', count: '5', unique_users: '3' }
      ];

      const mockSecuritySummary = [
        { event_type: 'permission_denied', severity: 'medium', count: '3' },
        { event_type: 'login_attempt', severity: 'low', count: '15' }
      ];

      const mockUserActivity = [
        {
          user_id: 'user-1',
          action_count: '25',
          unique_actions: '5',
          first_action: new Date(),
          last_action: new Date()
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockAuditSummary })
        .mockResolvedValueOnce({ rows: mockSecuritySummary })
        .mockResolvedValueOnce({ rows: mockUserActivity });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await auditService.generateComplianceReport(startDate, endDate);

      expect(mockPool.query).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        period: { start: startDate, end: endDate },
        audit_summary: mockAuditSummary,
        security_summary: mockSecuritySummary,
        top_users: mockUserActivity,
        total_audit_entries: 15,
        total_security_events: 18
      });
    });
  });
}); 