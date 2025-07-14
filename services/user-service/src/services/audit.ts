import { Pool } from 'pg';

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface SecurityEvent {
  id: string;
  event_type: 'login_attempt' | 'permission_denied' | 'role_assigned' | 'role_revoked' | 'password_changed' | 'account_locked' | 'suspicious_activity';
  user_id?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface AuditFilters {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface SecurityEventFilters {
  event_type?: string;
  severity?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface AuditSummary {
  action: string;
  count: string;
  unique_users: string;
}

export interface SecuritySummary {
  event_type: string;
  severity: string;
  count: string;
}

export interface UserActivity {
  user_id: string;
  action_count: string;
  unique_actions: string;
  first_action: Date;
  last_action: Date;
}

export interface AuditService {
  logAction(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog>;
  getAuditLogs(filters: AuditFilters): Promise<AuditLog[]>;
  getAuditLog(userId?: string, action?: string, startDate?: Date, endDate?: Date): Promise<AuditLog[]>;
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at'>): Promise<SecurityEvent>;
  getSecurityEvents(filters: SecurityEventFilters): Promise<SecurityEvent[]>;
  getAuditSummary(filters: AuditFilters): Promise<AuditSummary[]>;
  getSecuritySummary(filters: SecurityEventFilters): Promise<SecuritySummary[]>;
  getUserActivity(userId: string): Promise<UserActivity[]>;
  generateComplianceReport(startDate: Date, endDate: Date): Promise<any>;
}

export class AuditServiceImpl implements AuditService {
  constructor(private db: Pool) {}

  async logAction(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const result = await this.db.query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [log.user_id, log.action, log.resource, log.resource_id, JSON.stringify(log.details), log.ip_address, log.user_agent]
    );
    
    return result.rows[0];
  }

  async getAuditLogs(filters: AuditFilters): Promise<AuditLog[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(filters.userId);
    }

    if (filters.action) {
      query += ` AND action = $${paramIndex++}`;
      params.push(filters.action);
    }

    if (filters.resource) {
      query += ` AND resource = $${paramIndex++}`;
      params.push(filters.resource);
    }

    if (filters.startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async getAuditLog(userId?: string, action?: string, startDate?: Date, endDate?: Date): Promise<AuditLog[]> {
    return this.getAuditLogs({ userId, action, startDate, endDate });
  }

  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at'>): Promise<SecurityEvent> {
    const result = await this.db.query(
      `INSERT INTO security_events (event_type, user_id, details, severity, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [event.event_type, event.user_id, JSON.stringify(event.details), event.severity, event.ip_address, event.user_agent]
    );
    
    return result.rows[0];
  }

  async getSecurityEvents(filters: SecurityEventFilters): Promise<SecurityEvent[]> {
    let query = 'SELECT * FROM security_events WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.event_type) {
      query += ` AND event_type = $${paramIndex++}`;
      params.push(filters.event_type);
    }

    if (filters.severity) {
      query += ` AND severity = $${paramIndex++}`;
      params.push(filters.severity);
    }

    if (filters.start_date) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(filters.end_date);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async getAuditSummary(filters: AuditFilters): Promise<AuditSummary[]> {
    let query = `
      SELECT action, COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users
      FROM audit_logs 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(filters.userId);
    }

    if (filters.startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    query += ' GROUP BY action ORDER BY count DESC';

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async getSecuritySummary(filters: SecurityEventFilters): Promise<SecuritySummary[]> {
    let query = `
      SELECT event_type, severity, COUNT(*) as count
      FROM security_events 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.event_type) {
      query += ` AND event_type = $${paramIndex++}`;
      params.push(filters.event_type);
    }

    if (filters.severity) {
      query += ` AND severity = $${paramIndex++}`;
      params.push(filters.severity);
    }

    if (filters.start_date) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(filters.end_date);
    }

    query += ' GROUP BY event_type, severity ORDER BY count DESC';

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async getUserActivity(userId: string): Promise<UserActivity[]> {
    const result = await this.db.query(
      `SELECT 
        user_id,
        COUNT(*) as action_count,
        COUNT(DISTINCT action) as unique_actions,
        MIN(created_at) as first_action,
        MAX(created_at) as last_action
       FROM audit_logs 
       WHERE user_id = $1
       GROUP BY user_id`,
      [userId]
    );
    
    return result.rows;
  }

  async generateComplianceReport(startDate: Date, endDate: Date): Promise<any> {
    const auditSummary = await this.getAuditSummary({ startDate, endDate });
    const securitySummary = await this.getSecuritySummary({ 
      start_date: startDate.toISOString(), 
      end_date: endDate.toISOString() 
    });

    return {
      period: { startDate, endDate },
      auditSummary,
      securitySummary,
      generatedAt: new Date()
    };
  }
} 