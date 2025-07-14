"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateHealthCheck = exports.validateRateLimitConfig = exports.validatePagination = exports.validateSessionRefresh = exports.validateSessionCreate = exports.validateMFADisable = exports.validateMFAVerify = exports.validateMFASetup = exports.validateOAuthLogin = exports.validatePasswordReset = exports.validatePasswordResetRequest = exports.validatePasswordChange = exports.validateUserUpdate = exports.validateUserLogin = exports.validateUserRegistration = exports.healthCheckSchema = exports.rateLimitConfigSchema = exports.paginationSchema = exports.sessionRefreshSchema = exports.sessionCreateSchema = exports.mfaDisableSchema = exports.mfaVerifySchema = exports.mfaSetupSchema = exports.oAuthLoginSchema = exports.passwordResetSchema = exports.passwordResetRequestSchema = exports.passwordChangeSchema = exports.userUpdateSchema = exports.userLoginSchema = exports.userRegistrationSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
// User validation schemas
exports.userRegistrationSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters'),
    firstName: zod_1.z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: zod_1.z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});
exports.userLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required')
});
exports.userUpdateSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').optional(),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').optional(),
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters').optional(),
    preferences: zod_1.z.object({
        theme: zod_1.z.enum(['light', 'dark', 'system']).optional(),
        language: zod_1.z.string().optional(),
        timezone: zod_1.z.string().optional(),
        notifications: zod_1.z.object({
            email: zod_1.z.boolean().optional(),
            push: zod_1.z.boolean().optional(),
            sms: zod_1.z.boolean().optional()
        }).optional()
    }).optional()
});
// Authentication validation schemas
exports.passwordChangeSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    confirmNewPassword: zod_1.z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"]
});
exports.passwordResetRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format')
});
exports.passwordResetSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    newPassword: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    confirmNewPassword: zod_1.z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"]
});
// OAuth validation schemas
exports.oAuthLoginSchema = zod_1.z.object({
    provider: zod_1.z.nativeEnum(types_1.OAuthProvider),
    code: zod_1.z.string().min(1, 'Authorization code is required'),
    state: zod_1.z.string().optional()
});
// MFA validation schemas
exports.mfaSetupSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(types_1.MFAType),
    identifier: zod_1.z.string().optional() // For SMS/Email MFA
});
exports.mfaVerifySchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(types_1.MFAType),
    code: zod_1.z.string().min(1, 'MFA code is required'),
    identifier: zod_1.z.string().optional() // For SMS/Email MFA
});
exports.mfaDisableSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(types_1.MFAType),
    password: zod_1.z.string().min(1, 'Password is required for security')
});
// Session validation schemas
exports.sessionCreateSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
    ipAddress: zod_1.z.string().ip('Invalid IP address').optional(),
    userAgent: zod_1.z.string().optional()
});
exports.sessionRefreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required')
});
// Pagination validation schemas
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.number().int().min(1, 'Page must be at least 1').default(1),
    limit: zod_1.z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc')
});
// Rate limiting validation schemas
exports.rateLimitConfigSchema = zod_1.z.object({
    windowMs: zod_1.z.number().int().min(1000, 'Window must be at least 1000ms'),
    maxRequests: zod_1.z.number().int().min(1, 'Max requests must be at least 1'),
    message: zod_1.z.string().optional(),
    statusCode: zod_1.z.number().int().min(400, 'Status code must be at least 400').max(599, 'Status code must be less than 600').default(429)
});
// Health check validation schemas
exports.healthCheckSchema = zod_1.z.object({
    service: zod_1.z.string().min(1, 'Service name is required'),
    status: zod_1.z.enum(['healthy', 'unhealthy', 'degraded']),
    responseTime: zod_1.z.number().min(0, 'Response time must be non-negative'),
    details: zod_1.z.record(zod_1.z.any()).optional()
});
// Export validation functions
const validateUserRegistration = (data) => exports.userRegistrationSchema.parse(data);
exports.validateUserRegistration = validateUserRegistration;
const validateUserLogin = (data) => exports.userLoginSchema.parse(data);
exports.validateUserLogin = validateUserLogin;
const validateUserUpdate = (data) => exports.userUpdateSchema.parse(data);
exports.validateUserUpdate = validateUserUpdate;
const validatePasswordChange = (data) => exports.passwordChangeSchema.parse(data);
exports.validatePasswordChange = validatePasswordChange;
const validatePasswordResetRequest = (data) => exports.passwordResetRequestSchema.parse(data);
exports.validatePasswordResetRequest = validatePasswordResetRequest;
const validatePasswordReset = (data) => exports.passwordResetSchema.parse(data);
exports.validatePasswordReset = validatePasswordReset;
const validateOAuthLogin = (data) => exports.oAuthLoginSchema.parse(data);
exports.validateOAuthLogin = validateOAuthLogin;
const validateMFASetup = (data) => exports.mfaSetupSchema.parse(data);
exports.validateMFASetup = validateMFASetup;
const validateMFAVerify = (data) => exports.mfaVerifySchema.parse(data);
exports.validateMFAVerify = validateMFAVerify;
const validateMFADisable = (data) => exports.mfaDisableSchema.parse(data);
exports.validateMFADisable = validateMFADisable;
const validateSessionCreate = (data) => exports.sessionCreateSchema.parse(data);
exports.validateSessionCreate = validateSessionCreate;
const validateSessionRefresh = (data) => exports.sessionRefreshSchema.parse(data);
exports.validateSessionRefresh = validateSessionRefresh;
const validatePagination = (data) => exports.paginationSchema.parse(data);
exports.validatePagination = validatePagination;
const validateRateLimitConfig = (data) => exports.rateLimitConfigSchema.parse(data);
exports.validateRateLimitConfig = validateRateLimitConfig;
const validateHealthCheck = (data) => exports.healthCheckSchema.parse(data);
exports.validateHealthCheck = validateHealthCheck;
//# sourceMappingURL=index.js.map