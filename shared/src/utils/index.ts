import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, ApiError } from '../types';

// Response utilities
export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
  meta: {
    timestamp: new Date().toISOString(),
    requestId: uuidv4(),
    version: '1.0.0'
  }
});

export const createErrorResponse = (
  message: string,
  errors?: ApiError[],
  statusCode: number = 400
): ApiResponse => ({
  success: false,
  message,
  errors,
  meta: {
    timestamp: new Date().toISOString(),
    requestId: uuidv4(),
    version: '1.0.0'
  }
});

export const createApiError = (
  code: string,
  message: string,
  field?: string,
  details?: any
): ApiError => ({
  code,
  message,
  field,
  details
});

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Date utilities
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

export const isExpired = (date: Date): boolean => {
  return new Date() > date;
};

// String utilities
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateBackupCodes = (count: number = 8): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateRandomString(8).toUpperCase());
  }
  return codes;
};

// Crypto utilities
export const generateSecureToken = (): string => {
  return uuidv4() + '.' + Date.now() + '.' + Math.random().toString(36).substr(2, 9);
};

export const hashString = async (input: string): Promise<string> => {
  // This is a simple hash for demonstration
  // In production, use proper hashing libraries like bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Rate limiting utilities
export const createRateLimitKey = (identifier: string, action: string): string => {
  return `rate_limit:${identifier}:${action}`;
};

export const parseRateLimitInfo = (limit: number, remaining: number, reset: Date): any => {
  return {
    limit,
    remaining,
    reset,
    retryAfter: Math.max(0, Math.ceil((reset.getTime() - Date.now()) / 1000))
  };
};

// Logging utilities
export const createLogEntry = (
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  metadata?: Record<string, any>
) => {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata,
    requestId: uuidv4()
  };
};

// Pagination utilities
export const calculatePagination = (
  total: number,
  page: number,
  limit: number
) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev
  };
};

// Health check utilities
export const createHealthCheck = (
  service: string,
  status: 'healthy' | 'unhealthy' | 'degraded',
  responseTime: number,
  details?: Record<string, any>
) => {
  return {
    service,
    status,
    timestamp: new Date(),
    responseTime,
    details
  };
};

// Service communication utilities
export const createServiceRequest = <T>(
  service: string,
  action: string,
  data: T,
  correlationId?: string
) => {
  return {
    id: uuidv4(),
    service,
    action,
    data,
    timestamp: new Date(),
    correlationId: correlationId || uuidv4()
  };
};

export const createServiceResponse = <T>(
  requestId: string,
  success: boolean,
  data?: T,
  error?: string,
  correlationId?: string
) => {
  return {
    id: uuidv4(),
    success,
    data,
    error,
    timestamp: new Date(),
    correlationId: correlationId || requestId
  };
};

// Environment utilities
export const getEnvironmentVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue!;
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test';
};

// Error handling utilities
export const handleAsyncError = async <T>(
  promise: Promise<T>,
  errorMessage: string = 'An error occurred'
): Promise<T> => {
  try {
    return await promise;
  } catch (error) {
    console.error(errorMessage, error);
    throw new Error(errorMessage);
  }
};

export const createErrorWithCode = (code: string, message: string): Error => {
  const error = new Error(message);
  (error as any).code = code;
  return error;
};

// Validation result utilities
export const createValidationResult = <T>(
  isValid: boolean,
  data?: T,
  errors?: string[]
) => {
  return {
    isValid,
    data,
    errors: errors || []
  };
}; 