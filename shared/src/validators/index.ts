import { z } from 'zod';
import { UserRole, OAuthProvider, MFAType } from '../types';

// User validation schemas
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const userUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters').optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional()
    }).optional()
  }).optional()
});

// Authentication validation schemas
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"]
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email format')
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"]
});

// OAuth validation schemas
export const oAuthLoginSchema = z.object({
  provider: z.nativeEnum(OAuthProvider),
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional()
});

// MFA validation schemas
export const mfaSetupSchema = z.object({
  type: z.nativeEnum(MFAType),
  identifier: z.string().optional() // For SMS/Email MFA
});

export const mfaVerifySchema = z.object({
  type: z.nativeEnum(MFAType),
  code: z.string().min(1, 'MFA code is required'),
  identifier: z.string().optional() // For SMS/Email MFA
});

export const mfaDisableSchema = z.object({
  type: z.nativeEnum(MFAType),
  password: z.string().min(1, 'Password is required for security')
});

// Session validation schemas
export const sessionCreateSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  ipAddress: z.string().ip('Invalid IP address').optional(),
  userAgent: z.string().optional()
});

export const sessionRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Pagination validation schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// Rate limiting validation schemas
export const rateLimitConfigSchema = z.object({
  windowMs: z.number().int().min(1000, 'Window must be at least 1000ms'),
  maxRequests: z.number().int().min(1, 'Max requests must be at least 1'),
  message: z.string().optional(),
  statusCode: z.number().int().min(400, 'Status code must be at least 400').max(599, 'Status code must be less than 600').default(429)
});

// Health check validation schemas
export const healthCheckSchema = z.object({
  service: z.string().min(1, 'Service name is required'),
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  responseTime: z.number().min(0, 'Response time must be non-negative'),
  details: z.record(z.any()).optional()
});

// Export validation functions
export const validateUserRegistration = (data: unknown) => userRegistrationSchema.parse(data);
export const validateUserLogin = (data: unknown) => userLoginSchema.parse(data);
export const validateUserUpdate = (data: unknown) => userUpdateSchema.parse(data);
export const validatePasswordChange = (data: unknown) => passwordChangeSchema.parse(data);
export const validatePasswordResetRequest = (data: unknown) => passwordResetRequestSchema.parse(data);
export const validatePasswordReset = (data: unknown) => passwordResetSchema.parse(data);
export const validateOAuthLogin = (data: unknown) => oAuthLoginSchema.parse(data);
export const validateMFASetup = (data: unknown) => mfaSetupSchema.parse(data);
export const validateMFAVerify = (data: unknown) => mfaVerifySchema.parse(data);
export const validateMFADisable = (data: unknown) => mfaDisableSchema.parse(data);
export const validateSessionCreate = (data: unknown) => sessionCreateSchema.parse(data);
export const validateSessionRefresh = (data: unknown) => sessionRefreshSchema.parse(data);
export const validatePagination = (data: unknown) => paginationSchema.parse(data);
export const validateRateLimitConfig = (data: unknown) => rateLimitConfigSchema.parse(data);
export const validateHealthCheck = (data: unknown) => healthCheckSchema.parse(data); 