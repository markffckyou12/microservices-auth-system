# 🎨 CREATIVE PHASE: DATABASE SCHEMA ARCHITECTURE

**Date:** 2024-12-20  
**Component:** Database Schema Design  
**Type:** Data Model Design  
**Complexity:** Level 4 (Complex System)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1️⃣ PROBLEM

**Description:** Design a comprehensive database schema for a monorepo authentication system that supports multiple authentication methods, user management, role-based access control, and session management.

**Requirements:**
- Support JWT-based authentication with refresh tokens
- Enable OAuth integration (Google, GitHub)
- Implement multi-factor authentication (TOTP, SMS)
- Support role-based access control (RBAC)
- Handle session management with Redis
- Support password reset and account lockout
- Enable audit logging for security events
- Support user preferences and profile management

**Constraints:**
- Must work with PostgreSQL for user data
- Must work with Redis for session data
- Must support high concurrency
- Must maintain data integrity and consistency
- Must support efficient querying for authentication checks

## 2️⃣ OPTIONS

**Option A: Normalized Schema with Separate Auth Tables**
- Traditional normalized approach with separate tables for users, roles, permissions
- Clear separation of concerns with foreign key relationships
- Complex joins for permission checks

**Option B: Denormalized Schema with JSON Fields**
- Store user roles and permissions as JSON in user table
- Faster reads for authentication checks
- Potential data consistency issues

**Option C: Hybrid Schema with Caching Layer**
- Normalized core schema with Redis caching
- Best of both worlds: consistency and performance
- More complex to implement and maintain

## 3️⃣ ANALYSIS

| Criterion | Normalized | Denormalized | Hybrid |
|-----|-----|-----|-----|
| **Performance** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Data Consistency** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Scalability** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Maintainability** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Query Complexity** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Storage Efficiency** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

**Key Insights:**
- Normalized approach provides best data integrity but poor performance for auth checks
- Denormalized approach offers best performance but risks data inconsistency
- Hybrid approach balances performance and consistency with Redis caching layer

## 4️⃣ DECISION

**Selected:** Option C: Hybrid Schema with Caching Layer

**Rationale:** 
The hybrid approach provides the best balance of performance, consistency, and scalability. The normalized PostgreSQL schema ensures data integrity, while the Redis caching layer provides fast authentication checks. This approach also aligns well with the microservices architecture where different services can cache relevant data.

## 5️⃣ IMPLEMENTATION NOTES

### PostgreSQL Schema Design

```sql
-- Users table (core user data)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    backup_codes JSONB
);

-- OAuth accounts (for external providers)
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google', 'github'
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role permissions (many-to-many)
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- User roles (many-to-many)
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions (for session-based auth if needed)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Redis Schema Design

```redis
# User authentication cache
user:auth:{user_id} -> {
  "id": "uuid",
  "email": "user@example.com",
  "roles": ["admin", "user"],
  "permissions": ["read:users", "write:users"],
  "mfa_enabled": true,
  "last_login": "2024-12-20T10:00:00Z"
}

# Session storage
session:{session_id} -> {
  "user_id": "uuid",
  "created_at": "2024-12-20T10:00:00Z",
  "expires_at": "2024-12-27T10:00:00Z",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}

# Rate limiting
rate_limit:login:{ip_address} -> count
rate_limit:password_reset:{email} -> count

# JWT blacklist (for token revocation)
jwt_blacklist:{token_hash} -> "revoked_at_timestamp"

# OAuth state tokens
oauth_state:{state_token} -> {
  "provider": "google",
  "redirect_uri": "https://app.com/callback",
  "created_at": "2024-12-20T10:00:00Z"
}
```

### Caching Strategy

```javascript
// Cache invalidation patterns
const CACHE_KEYS = {
  USER_AUTH: 'user:auth:{userId}',
  USER_SESSIONS: 'user:sessions:{userId}',
  ROLE_PERMISSIONS: 'role:permissions:{roleId}',
  RATE_LIMIT: 'rate_limit:{action}:{identifier}'
};

// Cache TTL settings
const CACHE_TTL = {
  USER_AUTH: 3600, // 1 hour
  USER_SESSIONS: 86400, // 24 hours
  ROLE_PERMISSIONS: 7200, // 2 hours
  RATE_LIMIT: 300 // 5 minutes
};
```

### Indexes for Performance

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_oauth_provider_user ON oauth_accounts(provider, provider_user_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
```

### Migration Strategy

```javascript
// Migration approach
const MIGRATIONS = [
  {
    version: 1,
    name: 'Initial schema',
    up: async (db) => {
      // Create all tables
    },
    down: async (db) => {
      // Drop all tables
    }
  },
  {
    version: 2,
    name: 'Add MFA support',
    up: async (db) => {
      await db.query('ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT false');
      await db.query('ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(255)');
    }
  }
];
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 CREATIVE PHASE END: DATABASE SCHEMA ARCHITECTURE 