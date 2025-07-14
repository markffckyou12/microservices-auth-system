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
  user_id?: string;
  action?: string;
  resource?: string;
  start_date?: string;
  end_date?: string;
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
  period: {
    start: Date;
    end: Date;
  };
  audit_summary: any[];
  security_summary: any[];
  top_users: any[];
  total_audit_entries: number;
  total_security_events: number;
}

export interface AuditService {
  logAction(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog>;
  getAuditLogs(filters: AuditFilters): Promise<AuditLog[]>;
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at'>): Promise<SecurityEvent>;
  getSecurityEvents(filters: SecurityEventFilters): Promise<SecurityEvent[]>;
  getAuditSummary(filters: { start_date?: string; end_date?: string }): Promise<AuditSummary>;
}

export class AuditServiceImpl implements AuditService {
  constructor(private db: Pool) {}

  async logAction(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const query = `
      INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await this.db.query(query, [
      log.user_id,
      log.action,
      log.resource,
      log.resource_id,
      JSON.stringify(log.details),
      log.ip_address,
      log.user_agent
    ]);
    
    return this.mapAuditLogFromDb(result.rows[0]);
  }

  async getAuditLogs(filters: AuditFilters): Promise<AuditLog[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.user_id) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(filters.user_id);
      paramIndex++;
    }

    if (filters.action) {
      query += ` AND action = $${paramIndex}`;
      params.push(filters.action);
      paramIndex++;
    }

    if (filters.resource) {
      query += ` AND resource = $${paramIndex}`;
      params.push(filters.resource);
      paramIndex++;
    }

    if (filters.start_date) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(new Date(filters.start_date));
      paramIndex++;
    }

    if (filters.end_date) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(new Date(filters.end_date));
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
      paramIndex++;
    }

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapAuditLogFromDb(row));
  }

  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at'>): Promise<SecurityEvent> {
    const query = `
      INSERT INTO security_events (event_type, user_id, details, severity, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await this.db.query(query, [
      event.event_type,
      event.user_id,
      JSON.stringify(event.details),
      event.severity,
      event.ip_address,
      event.user_agent
    ]);
    
    return this.mapSecurityEventFromDb(result.rows[0]);
  }

  async getSecurityEvents(filters: SecurityEventFilters): Promise<SecurityEvent[]> {
    let query = 'SELECT * FROM security_events WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.event_type) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(filters.event_type);
      paramIndex++;
    }

    if (filters.severity) {
      query += ` AND severity = $${paramIndex}`;
      params.push(filters.severity);
      paramIndex++;
    }

    if (filters.start_date) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(new Date(filters.start_date));
      paramIndex++;
    }

    if (filters.end_date) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(new Date(filters.end_date));
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
      paramIndex++;
    }

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapSecurityEventFromDb(row));
  }

  async getAuditSummary(filters: { start_date?: string; end_date?: string }): Promise<AuditSummary> {
    const startDate = filters.start_date ? new Date(filters.start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = filters.end_date ? new Date(filters.end_date) : new Date();

    // Get audit log summary
    const auditQuery = `
      SELECT 
        action,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM audit_logs 
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY action
      ORDER BY count DESC
    `;
    
    const auditResult = await this.db.query(auditQuery, [startDate, endDate]);

    // Get security events summary
    const securityQuery = `
      SELECT 
        event_type,
        severity,
        COUNT(*) as count
      FROM security_events 
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY event_type, severity
      ORDER BY event_type, severity
    `;
    
    const securityResult = await this.db.query(securityQuery, [startDate, endDate]);

    // Get user activity summary
    const userActivityQuery = `
      SELECT 
        user_id,
        COUNT(*) as action_count,
        COUNT(DISTINCT action) as unique_actions,
        MIN(created_at) as first_action,
        MAX(created_at) as last_action
      FROM audit_logs 
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY user_id
      ORDER BY action_count DESC
      LIMIT 10
    `;
    
    const userActivityResult = await this.db.query(userActivityQuery, [startDate, endDate]);

    return {
      period: {
        start: startDate,
        end: endDate
      },
      audit_summary: auditResult.rows,
      security_summary: securityResult.rows,
      top_users: userActivityResult.rows,
      total_audit_entries: auditResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
      total_security_events: securityResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
    };
  }

  private mapAuditLogFromDb(row: any): AuditLog {
    return {
      id: row.id,
      user_id: row.user_id,
      action: row.action,
      resource: row.resource,
      resource_id: row.resource_id,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      created_at: new Date(row.created_at)
    };
  }

  private mapSecurityEventFromDb(row: any): SecurityEvent {
    return {
      id: row.id,
      event_type: row.event_type,
      user_id: row.user_id,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
      severity: row.severity,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      created_at: new Date(row.created_at)
    };
  }
} 