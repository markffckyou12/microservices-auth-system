import { Pool } from 'pg';

export interface AuditLog {
  id: string;
  user_id?: string;
  event_type: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface AuditFilters {
  userId?: string;
  eventType?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditSummary {
  event_type: string;
  action: string;
  count: string;
  unique_users: string;
}

export interface UserActivity {
  user_id: string;
  action_count: string;
  unique_actions: string;
  first_action: Date;
  last_action: Date;
}

export interface ComplianceReport {
  period: {
    start: Date;
    end: Date;
  };
  total_events: number;
  events_by_type: Record<string, number>;
  events_by_user: Record<string, number>;
  security_events: number;
  authentication_events: number;
  rbac_events: number;
  profile_events: number;
}

export interface AuditService {
  logEvent(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog>;
  getAuditLogs(filters: AuditFilters): Promise<AuditLog[]>;
  getAuditLogById(id: string): Promise<AuditLog | null>;
  getAuditSummary(filters: AuditFilters): Promise<AuditSummary[]>;
  getUserActivity(userId: string): Promise<UserActivity[]>;
  generateComplianceReport(startDate: Date, endDate: Date): Promise<ComplianceReport>;
  exportAuditLogs(filters: AuditFilters): Promise<AuditLog[]>;
}

export class AuditServiceImpl implements AuditService {
  constructor(private db: Pool) {}

  async logEvent(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const result = await this.db.query(
      `INSERT INTO audit_logs (user_id, event_type, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        log.user_id, 
        log.event_type, 
        log.action, 
        log.resource_type, 
        log.resource_id, 
        JSON.stringify(log.details), 
        log.ip_address, 
        log.user_agent
      ]
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

    if (filters.eventType) {
      query += ` AND event_type = $${paramIndex++}`;
      params.push(filters.eventType);
    }

    if (filters.action) {
      query += ` AND action = $${paramIndex++}`;
      params.push(filters.action);
    }

    if (filters.resourceType) {
      query += ` AND resource_type = $${paramIndex++}`;
      params.push(filters.resourceType);
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

  async getAuditLogById(id: string): Promise<AuditLog | null> {
    const result = await this.db.query(
      'SELECT * FROM audit_logs WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }

  async getAuditSummary(filters: AuditFilters): Promise<AuditSummary[]> {
    let query = `
      SELECT event_type, action, COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users
      FROM audit_logs 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(filters.userId);
    }

    if (filters.eventType) {
      query += ` AND event_type = $${paramIndex++}`;
      params.push(filters.eventType);
    }

    if (filters.startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    query += ' GROUP BY event_type, action ORDER BY count DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

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

  async generateComplianceReport(startDate: Date, endDate: Date): Promise<ComplianceReport> {
    // Get total events
    const totalEventsResult = await this.db.query(
      'SELECT COUNT(*) as count FROM audit_logs WHERE created_at BETWEEN $1 AND $2',
      [startDate, endDate]
    );

    // Get events by type
    const eventsByTypeResult = await this.db.query(
      `SELECT event_type, COUNT(*) as count 
       FROM audit_logs 
       WHERE created_at BETWEEN $1 AND $2 
       GROUP BY event_type`,
      [startDate, endDate]
    );

    // Get events by user
    const eventsByUserResult = await this.db.query(
      `SELECT user_id, COUNT(*) as count 
       FROM audit_logs 
       WHERE created_at BETWEEN $1 AND $2 AND user_id IS NOT NULL
       GROUP BY user_id`,
      [startDate, endDate]
    );

    // Get specific event type counts
    const securityEventsResult = await this.db.query(
      'SELECT COUNT(*) as count FROM audit_logs WHERE event_type = $1 AND created_at BETWEEN $2 AND $3',
      ['security', startDate, endDate]
    );

    const authEventsResult = await this.db.query(
      'SELECT COUNT(*) as count FROM audit_logs WHERE event_type = $1 AND created_at BETWEEN $2 AND $3',
      ['authentication', startDate, endDate]
    );

    const rbacEventsResult = await this.db.query(
      'SELECT COUNT(*) as count FROM audit_logs WHERE event_type = $1 AND created_at BETWEEN $2 AND $3',
      ['rbac', startDate, endDate]
    );

    const profileEventsResult = await this.db.query(
      'SELECT COUNT(*) as count FROM audit_logs WHERE event_type = $1 AND created_at BETWEEN $2 AND $3',
      ['profile', startDate, endDate]
    );

    const eventsByType: Record<string, number> = {};
    eventsByTypeResult.rows.forEach((row: any) => {
      eventsByType[row.event_type] = parseInt(row.count);
    });

    const eventsByUser: Record<string, number> = {};
    eventsByUserResult.rows.forEach((row: any) => {
      eventsByUser[row.user_id] = parseInt(row.count);
    });

    return {
      period: { start: startDate, end: endDate },
      total_events: parseInt(totalEventsResult.rows[0].count),
      events_by_type: eventsByType,
      events_by_user: eventsByUser,
      security_events: parseInt(securityEventsResult.rows[0].count),
      authentication_events: parseInt(authEventsResult.rows[0].count),
      rbac_events: parseInt(rbacEventsResult.rows[0].count),
      profile_events: parseInt(profileEventsResult.rows[0].count)
    };
  }

  async exportAuditLogs(filters: AuditFilters): Promise<AuditLog[]> {
    // Remove limit and offset for export
    const exportFilters = { ...filters };
    delete exportFilters.limit;
    delete exportFilters.offset;
    
    return this.getAuditLogs(exportFilters);
  }

  // Convenience methods for specific event types
  async logAuthenticationEvent(userId: string, action: string, details: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<AuditLog> {
    return this.logEvent({
      user_id: userId,
      event_type: 'authentication',
      action,
      resource_type: 'user',
      resource_id: userId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  async logRBACEvent(userId: string, action: string, details: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<AuditLog> {
    return this.logEvent({
      user_id: userId,
      event_type: 'rbac',
      action,
      resource_type: 'role',
      details,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  async logSecurityEvent(userId: string, action: string, details: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<AuditLog> {
    return this.logEvent({
      user_id: userId,
      event_type: 'security',
      action,
      resource_type: 'system',
      details,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  async logProfileEvent(userId: string, action: string, details: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<AuditLog> {
    return this.logEvent({
      user_id: userId,
      event_type: 'profile',
      action,
      resource_type: 'profile',
      resource_id: userId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }
} 