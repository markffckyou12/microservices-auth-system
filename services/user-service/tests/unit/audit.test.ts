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
    it('should log an event successfully', async () => {
      const mockAuditLog = {
        id: 'log-1',
        user_id: 'user-1',
        event_type: 'authentication',
        action: 'login',
        resource_type: 'user',
        resource_id: 'user-1',
        details: { method: 'POST', path: '/api/auth/login' },
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        created_at: new Date()
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [mockAuditLog]
      });

      const result = await auditService.logEvent({
        user_id: 'user-1',
        event_type: 'authentication',
        action: 'login',
        resource_type: 'user',
        resource_id: 'user-1',
        details: { method: 'POST', path: '/api/auth/login' },
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0'
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        ['user-1', 'authentication', 'login', 'user', 'user-1', '{"method":"POST","path":"/api/auth/login"}', '127.0.0.1', 'Mozilla/5.0']
      );
      expect(result).toEqual(mockAuditLog);
    });

    it('should get audit logs with filters', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          user_id: 'user-1',
          event_type: 'authentication',
          action: 'login',
          resource_type: 'user',
          resource_id: 'user-1',
          details: { method: 'POST', path: '/api/auth/login' },
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0',
          created_at: new Date()
        }
      ];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockLogs
      });

      const result = await auditService.getAuditLogs({ userId: 'user-1', eventType: 'authentication' });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM audit_logs WHERE 1=1'),
        ['user-1', 'authentication']
      );
      expect(result).toHaveLength(1);
    });

    it('should get audit logs without filters', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          user_id: 'user-1',
          event_type: 'authentication',
          action: 'login',
          resource_type: 'user',
          resource_id: 'user-1',
          details: { method: 'POST', path: '/api/auth/login' },
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0',
          created_at: new Date()
        }
      ];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockLogs
      });

      const result = await auditService.getAuditLogs({});

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
        user_id: 'user-1',
        event_type: 'security',
        action: 'permission_denied',
        resource_type: 'user',
        resource_id: 'user-1',
        details: { reason: 'Insufficient permissions' },
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        created_at: new Date()
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [mockSecurityEvent]
      });

      const result = await auditService.logSecurityEvent(
        'user-1',
        'permission_denied',
        { reason: 'Insufficient permissions' },
        '127.0.0.1',
        'Mozilla/5.0'
      );

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        ['user-1', 'security', 'permission_denied', 'user', 'user-1', '{"reason":"Insufficient permissions"}', '127.0.0.1', 'Mozilla/5.0']
      );
      expect(result).toEqual(mockSecurityEvent);
    });

    it('should get security events with filters', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          user_id: 'user-1',
          event_type: 'security',
          action: 'permission_denied',
          resource_type: 'user',
          resource_id: 'user-1',
          details: { reason: 'Insufficient permissions' },
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0',
          created_at: new Date()
        }
      ];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockEvents
      });

      const result = await auditService.getAuditLogs({ eventType: 'security', action: 'permission_denied' });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM audit_logs WHERE 1=1'),
        ['security', 'permission_denied']
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate compliance report', async () => {
      const mockComplianceReport = {
        period: {
          start: new Date(),
          end: new Date()
        },
        total_events: 100,
        events_by_type: { authentication: 50, security: 30, rbac: 20 },
        events_by_user: { 'user-1': 30, 'user-2': 40, 'user-3': 30 },
        security_events: 30,
        authentication_events: 50,
        rbac_events: 20,
        profile_events: 0
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ total_events: '100' }]
      });

      const result = await auditService.generateComplianceReport(new Date(), new Date());

      expect(result).toBeDefined();
      expect(result.total_events).toBeDefined();
      expect(result.period).toBeDefined();
    });
  });
});