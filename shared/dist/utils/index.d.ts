import { ApiResponse, ApiError } from '../types';
export declare const createSuccessResponse: <T>(data: T, message?: string) => ApiResponse<T>;
export declare const createErrorResponse: (message: string, errors?: ApiError[], statusCode?: number) => ApiResponse;
export declare const createApiError: (code: string, message: string, field?: string, details?: any) => ApiError;
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidPassword: (password: string) => boolean;
export declare const sanitizeInput: (input: string) => string;
export declare const addDays: (date: Date, days: number) => Date;
export declare const addHours: (date: Date, hours: number) => Date;
export declare const isExpired: (date: Date) => boolean;
export declare const generateRandomString: (length: number) => string;
export declare const generateBackupCodes: (count?: number) => string[];
export declare const generateSecureToken: () => string;
export declare const hashString: (input: string) => Promise<string>;
export declare const createRateLimitKey: (identifier: string, action: string) => string;
export declare const parseRateLimitInfo: (limit: number, remaining: number, reset: Date) => any;
export declare const createLogEntry: (level: "info" | "warn" | "error" | "debug", message: string, metadata?: Record<string, any>) => {
    timestamp: string;
    level: "info" | "warn" | "error" | "debug";
    message: string;
    metadata: Record<string, any> | undefined;
    requestId: string;
};
export declare const calculatePagination: (total: number, page: number, limit: number) => {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};
export declare const createHealthCheck: (service: string, status: "healthy" | "unhealthy" | "degraded", responseTime: number, details?: Record<string, any>) => {
    service: string;
    status: "healthy" | "unhealthy" | "degraded";
    timestamp: Date;
    responseTime: number;
    details: Record<string, any> | undefined;
};
export declare const createServiceRequest: <T>(service: string, action: string, data: T, correlationId?: string) => {
    id: string;
    service: string;
    action: string;
    data: T;
    timestamp: Date;
    correlationId: string;
};
export declare const createServiceResponse: <T>(requestId: string, success: boolean, data?: T, error?: string, correlationId?: string) => {
    id: string;
    success: boolean;
    data: T | undefined;
    error: string | undefined;
    timestamp: Date;
    correlationId: string;
};
export declare const getEnvironmentVariable: (key: string, defaultValue?: string) => string;
export declare const isDevelopment: () => boolean;
export declare const isProduction: () => boolean;
export declare const isTest: () => boolean;
export declare const handleAsyncError: <T>(promise: Promise<T>, errorMessage?: string) => Promise<T>;
export declare const createErrorWithCode: (code: string, message: string) => Error;
export declare const createValidationResult: <T>(isValid: boolean, data?: T, errors?: string[]) => {
    isValid: boolean;
    data: T | undefined;
    errors: string[];
};
//# sourceMappingURL=index.d.ts.map