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

export interface AuditService {
  logAction(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog>;
  getAuditLog(userId?: string, action?: string, startDate?: Date, endDate?: Date): Promise<AuditLog[]>;
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at'>): Promise<SecurityEvent>;
  getSecurityEvents(eventType?: string, severity?: string, startDate?: Date, endDate?: Date): Promise<SecurityEvent[]>;
  generateComplianceReport(startDate: Date, endDate: Date): Promise<Record<string, any>>;
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

  async getAuditLog(userId?: string, action?: string, startDate?: Date, endDate?: Date): Promise<AuditLog[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (action) {
      query += ` AND action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

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

  async getSecurityEvents(eventType?: string, severity?: string, startDate?: Date, endDate?: Date): Promise<SecurityEvent[]> {
    let query = 'SELECT * FROM security_events WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (eventType) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }

    if (severity) {
      query += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapSecurityEventFromDb(row));
  }

  async generateComplianceReport(startDate: Date, endDate: Date): Promise<Record<string, any>> {
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
      details: JSON.parse(row.details || '{}'),
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      created_at: row.created_at
    };
  }

  private mapSecurityEventFromDb(row: any): SecurityEvent {
    return {
      id: row.id,
      event_type: row.event_type,
      user_id: row.user_id,
      details: JSON.parse(row.details || '{}'),
      severity: row.severity,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      created_at: row.created_at
    };
  }
} 