export interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    role: UserRole;
    preferences: UserPreferences;
}
export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    notifications: NotificationSettings;
}
export interface NotificationSettings {
    email: boolean;
    push: boolean;
    sms: boolean;
}
export declare enum UserRole {
    ADMIN = "admin",
    USER = "user",
    MODERATOR = "moderator",
    GUEST = "guest"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    PENDING = "pending"
}
export interface AuthCredentials {
    email: string;
    password: string;
}
export interface AuthResponse {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
}
export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
}
export interface RefreshToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    isRevoked: boolean;
    createdAt: Date;
}
export interface Session {
    id: string;
    userId: string;
    token: string;
    ipAddress: string;
    userAgent: string;
    isActive: boolean;
    createdAt: Date;
    expiresAt: Date;
    lastActivityAt: Date;
}
export interface SessionData {
    userId: string;
    role: UserRole;
    permissions: string[];
    metadata: Record<string, any>;
}
export interface OAuthProfile {
    provider: OAuthProvider;
    providerId: string;
    email: string;
    name: string;
    picture?: string;
    accessToken: string;
    refreshToken?: string;
}
export declare enum OAuthProvider {
    GOOGLE = "google",
    GITHUB = "github",
    FACEBOOK = "facebook",
    LINKEDIN = "linkedin"
}
export interface MFASetup {
    userId: string;
    secret: string;
    backupCodes: string[];
    isEnabled: boolean;
    createdAt: Date;
}
export interface MFAMethod {
    id: string;
    userId: string;
    type: MFAType;
    identifier: string;
    isEnabled: boolean;
    createdAt: Date;
}
export declare enum MFAType {
    TOTP = "totp",
    SMS = "sms",
    EMAIL = "email",
    BACKUP = "backup"
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: ApiError[];
    meta?: {
        timestamp: string;
        requestId: string;
        version: string;
    };
}
export interface ApiError {
    code: string;
    message: string;
    field?: string;
    details?: any;
}
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface AuthEvent {
    id: string;
    type: AuthEventType;
    userId: string;
    metadata: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
}
export declare enum AuthEventType {
    LOGIN = "login",
    LOGOUT = "logout",
    REGISTER = "register",
    PASSWORD_CHANGE = "password_change",
    PASSWORD_RESET = "password_reset",
    EMAIL_VERIFICATION = "email_verification",
    MFA_ENABLE = "mfa_enable",
    MFA_DISABLE = "mfa_disable",
    OAUTH_LOGIN = "oauth_login",
    ACCOUNT_LOCK = "account_lock",
    ACCOUNT_UNLOCK = "account_unlock"
}
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message: string;
    statusCode: number;
}
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: Date;
    retryAfter: number;
}
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    pool?: {
        min: number;
        max: number;
        idleTimeoutMillis: number;
    };
}
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
}
export interface ServiceRequest<T = any> {
    id: string;
    service: string;
    action: string;
    data: T;
    timestamp: Date;
    correlationId: string;
}
export interface ServiceResponse<T = any> {
    id: string;
    success: boolean;
    data?: T;
    error?: string;
    timestamp: Date;
    correlationId: string;
}
export interface HealthCheck {
    service: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: Date;
    responseTime: number;
    details?: Record<string, any>;
}
export interface HealthCheckResponse {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: Date;
    services: HealthCheck[];
    uptime: number;
    version: string;
}
//# sourceMappingURL=index.d.ts.map