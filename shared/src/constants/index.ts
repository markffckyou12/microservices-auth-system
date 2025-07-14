// API Constants
export const API_VERSION = '1.0.0';
export const API_BASE_PATH = '/api/v1';

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// Authentication Constants
export const AUTH_CONSTANTS = {
  JWT_EXPIRES_IN: '24h',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  EMAIL_MAX_LENGTH: 255,
  NAME_MAX_LENGTH: 50,
  SESSION_EXPIRES_IN: '30d',
  MFA_BACKUP_CODES_COUNT: 8,
  MFA_BACKUP_CODE_LENGTH: 8,
  TOTP_DIGITS: 6,
  TOTP_PERIOD: 30,
  TOTP_WINDOW: 2
} as const;

// Rate Limiting Constants
export const RATE_LIMIT = {
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  LOGIN_MAX_REQUESTS: 5,
  REGISTER_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  REGISTER_MAX_REQUESTS: 3,
  PASSWORD_RESET_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  PASSWORD_RESET_MAX_REQUESTS: 3,
  API_WINDOW_MS: 60 * 1000, // 1 minute
  API_MAX_REQUESTS: 100
} as const;

// Database Constants
export const DB_CONSTANTS = {
  MAX_CONNECTIONS: 20,
  MIN_CONNECTIONS: 2,
  IDLE_TIMEOUT: 30000,
  CONNECTION_TIMEOUT: 10000,
  QUERY_TIMEOUT: 30000
} as const;

// Redis Constants
export const REDIS_CONSTANTS = {
  SESSION_PREFIX: 'session:',
  RATE_LIMIT_PREFIX: 'rate_limit:',
  MFA_PREFIX: 'mfa:',
  REFRESH_TOKEN_PREFIX: 'refresh_token:',
  USER_PREFIX: 'user:',
  DEFAULT_TTL: 3600, // 1 hour
  SESSION_TTL: 2592000, // 30 days
  RATE_LIMIT_TTL: 900, // 15 minutes
  MFA_TTL: 300 // 5 minutes
} as const;

// Security Constants
export const SECURITY_CONSTANTS = {
  BCRYPT_ROUNDS: 12,
  JWT_ALGORITHM: 'HS256',
  CORS_ORIGINS: ['http://localhost:3000', 'http://localhost:3001'],
  CORS_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  CORS_HEADERS: ['Content-Type', 'Authorization'],
  SECURE_COOKIES: false, // Set to true in production
  HTTP_ONLY_COOKIES: true,
  SAME_SITE_COOKIES: 'lax'
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication Errors
  INVALID_CREDENTIALS: 'AUTH_001',
  USER_NOT_FOUND: 'AUTH_002',
  ACCOUNT_LOCKED: 'AUTH_003',
  ACCOUNT_DISABLED: 'AUTH_004',
  TOKEN_EXPIRED: 'AUTH_005',
  TOKEN_INVALID: 'AUTH_006',
  TOKEN_MISSING: 'AUTH_007',
  REFRESH_TOKEN_INVALID: 'AUTH_008',
  REFRESH_TOKEN_EXPIRED: 'AUTH_009',
  PASSWORD_TOO_WEAK: 'AUTH_010',
  EMAIL_ALREADY_EXISTS: 'AUTH_011',
  USERNAME_ALREADY_EXISTS: 'AUTH_012',
  
  // MFA Errors
  MFA_REQUIRED: 'MFA_001',
  MFA_CODE_INVALID: 'MFA_002',
  MFA_CODE_EXPIRED: 'MFA_003',
  MFA_ALREADY_ENABLED: 'MFA_004',
  MFA_NOT_ENABLED: 'MFA_005',
  MFA_SETUP_REQUIRED: 'MFA_006',
  
  // OAuth Errors
  OAUTH_PROVIDER_NOT_SUPPORTED: 'OAUTH_001',
  OAUTH_CODE_INVALID: 'OAUTH_002',
  OAUTH_STATE_MISMATCH: 'OAUTH_003',
  OAUTH_EMAIL_MISMATCH: 'OAUTH_004',
  
  // Session Errors
  SESSION_NOT_FOUND: 'SESSION_001',
  SESSION_EXPIRED: 'SESSION_002',
  SESSION_INVALID: 'SESSION_003',
  TOO_MANY_SESSIONS: 'SESSION_004',
  
  // Validation Errors
  VALIDATION_ERROR: 'VAL_001',
  REQUIRED_FIELD_MISSING: 'VAL_002',
  INVALID_EMAIL_FORMAT: 'VAL_003',
  INVALID_PASSWORD_FORMAT: 'VAL_004',
  INVALID_USERNAME_FORMAT: 'VAL_005',
  
  // Rate Limiting Errors
  RATE_LIMIT_EXCEEDED: 'RATE_001',
  
  // Database Errors
  DATABASE_CONNECTION_ERROR: 'DB_001',
  DATABASE_QUERY_ERROR: 'DB_002',
  DATABASE_TRANSACTION_ERROR: 'DB_003',
  
  // Redis Errors
  REDIS_CONNECTION_ERROR: 'REDIS_001',
  REDIS_OPERATION_ERROR: 'REDIS_002',
  
  // Service Errors
  SERVICE_UNAVAILABLE: 'SVC_001',
  SERVICE_TIMEOUT: 'SVC_002',
  SERVICE_COMMUNICATION_ERROR: 'SVC_003',
  
  // General Errors
  INTERNAL_SERVER_ERROR: 'GEN_001',
  NOT_FOUND: 'GEN_002',
  UNAUTHORIZED: 'GEN_003',
  FORBIDDEN: 'GEN_004',
  BAD_REQUEST: 'GEN_005'
} as const;

// Event Types
export const EVENT_TYPES = {
  // User Events
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_PASSWORD_CHANGED: 'user.password_changed',
  USER_PASSWORD_RESET: 'user.password_reset',
  USER_EMAIL_VERIFIED: 'user.email_verified',
  
  // MFA Events
  MFA_ENABLED: 'mfa.enabled',
  MFA_DISABLED: 'mfa.disabled',
  MFA_VERIFIED: 'mfa.verified',
  MFA_FAILED: 'mfa.failed',
  
  // OAuth Events
  OAUTH_LOGIN: 'oauth.login',
  OAUTH_LINKED: 'oauth.linked',
  OAUTH_UNLINKED: 'oauth.unlinked',
  
  // Session Events
  SESSION_CREATED: 'session.created',
  SESSION_DESTROYED: 'session.destroyed',
  SESSION_REFRESHED: 'session.refreshed',
  
  // Security Events
  ACCOUNT_LOCKED: 'security.account_locked',
  ACCOUNT_UNLOCKED: 'security.account_unlocked',
  SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'security.rate_limit_exceeded'
} as const;

// Environment Constants
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  STAGING: 'staging'
} as const;

// Service Names
export const SERVICE_NAMES = {
  AUTH_SERVICE: 'auth-service',
  USER_SERVICE: 'user-service',
  SESSION_SERVICE: 'session-service',
  FRONTEND: 'frontend'
} as const;

// Health Check Constants
export const HEALTH_CHECK = {
  TIMEOUT: 5000, // 5 seconds
  INTERVAL: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  DEGRADED_THRESHOLD: 1000 // 1 second
} as const;

// Logging Constants
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
} as const;

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
} as const; 