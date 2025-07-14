"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValidationResult = exports.createErrorWithCode = exports.handleAsyncError = exports.isTest = exports.isProduction = exports.isDevelopment = exports.getEnvironmentVariable = exports.createServiceResponse = exports.createServiceRequest = exports.createHealthCheck = exports.calculatePagination = exports.createLogEntry = exports.parseRateLimitInfo = exports.createRateLimitKey = exports.hashString = exports.generateSecureToken = exports.generateBackupCodes = exports.generateRandomString = exports.isExpired = exports.addHours = exports.addDays = exports.sanitizeInput = exports.isValidPassword = exports.isValidEmail = exports.createApiError = exports.createErrorResponse = exports.createSuccessResponse = void 0;
const uuid_1 = require("uuid");
// Response utilities
const createSuccessResponse = (data, message) => ({
    success: true,
    data,
    message,
    meta: {
        timestamp: new Date().toISOString(),
        requestId: (0, uuid_1.v4)(),
        version: '1.0.0'
    }
});
exports.createSuccessResponse = createSuccessResponse;
const createErrorResponse = (message, errors, statusCode = 400) => ({
    success: false,
    message,
    errors,
    meta: {
        timestamp: new Date().toISOString(),
        requestId: (0, uuid_1.v4)(),
        version: '1.0.0'
    }
});
exports.createErrorResponse = createErrorResponse;
const createApiError = (code, message, field, details) => ({
    code,
    message,
    field,
    details
});
exports.createApiError = createApiError;
// Validation utilities
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidPassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};
exports.isValidPassword = isValidPassword;
const sanitizeInput = (input) => {
    return input.trim().replace(/[<>]/g, '');
};
exports.sanitizeInput = sanitizeInput;
// Date utilities
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
exports.addDays = addDays;
const addHours = (date, hours) => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
};
exports.addHours = addHours;
const isExpired = (date) => {
    return new Date() > date;
};
exports.isExpired = isExpired;
// String utilities
const generateRandomString = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
exports.generateRandomString = generateRandomString;
const generateBackupCodes = (count = 8) => {
    const codes = [];
    for (let i = 0; i < count; i++) {
        codes.push((0, exports.generateRandomString)(8).toUpperCase());
    }
    return codes;
};
exports.generateBackupCodes = generateBackupCodes;
// Crypto utilities
const generateSecureToken = () => {
    return (0, uuid_1.v4)() + '.' + Date.now() + '.' + Math.random().toString(36).substr(2, 9);
};
exports.generateSecureToken = generateSecureToken;
const hashString = async (input) => {
    // This is a simple hash for demonstration
    // In production, use proper hashing libraries like bcrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
exports.hashString = hashString;
// Rate limiting utilities
const createRateLimitKey = (identifier, action) => {
    return `rate_limit:${identifier}:${action}`;
};
exports.createRateLimitKey = createRateLimitKey;
const parseRateLimitInfo = (limit, remaining, reset) => {
    return {
        limit,
        remaining,
        reset,
        retryAfter: Math.max(0, Math.ceil((reset.getTime() - Date.now()) / 1000))
    };
};
exports.parseRateLimitInfo = parseRateLimitInfo;
// Logging utilities
const createLogEntry = (level, message, metadata) => {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        metadata,
        requestId: (0, uuid_1.v4)()
    };
};
exports.createLogEntry = createLogEntry;
// Pagination utilities
const calculatePagination = (total, page, limit) => {
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
exports.calculatePagination = calculatePagination;
// Health check utilities
const createHealthCheck = (service, status, responseTime, details) => {
    return {
        service,
        status,
        timestamp: new Date(),
        responseTime,
        details
    };
};
exports.createHealthCheck = createHealthCheck;
// Service communication utilities
const createServiceRequest = (service, action, data, correlationId) => {
    return {
        id: (0, uuid_1.v4)(),
        service,
        action,
        data,
        timestamp: new Date(),
        correlationId: correlationId || (0, uuid_1.v4)()
    };
};
exports.createServiceRequest = createServiceRequest;
const createServiceResponse = (requestId, success, data, error, correlationId) => {
    return {
        id: (0, uuid_1.v4)(),
        success,
        data,
        error,
        timestamp: new Date(),
        correlationId: correlationId || requestId
    };
};
exports.createServiceResponse = createServiceResponse;
// Environment utilities
const getEnvironmentVariable = (key, defaultValue) => {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
        throw new Error(`Environment variable ${key} is required`);
    }
    return value || defaultValue;
};
exports.getEnvironmentVariable = getEnvironmentVariable;
const isDevelopment = () => {
    return process.env.NODE_ENV === 'development';
};
exports.isDevelopment = isDevelopment;
const isProduction = () => {
    return process.env.NODE_ENV === 'production';
};
exports.isProduction = isProduction;
const isTest = () => {
    return process.env.NODE_ENV === 'test';
};
exports.isTest = isTest;
// Error handling utilities
const handleAsyncError = async (promise, errorMessage = 'An error occurred') => {
    try {
        return await promise;
    }
    catch (error) {
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
};
exports.handleAsyncError = handleAsyncError;
const createErrorWithCode = (code, message) => {
    const error = new Error(message);
    error.code = code;
    return error;
};
exports.createErrorWithCode = createErrorWithCode;
// Validation result utilities
const createValidationResult = (isValid, data, errors) => {
    return {
        isValid,
        data,
        errors: errors || []
    };
};
exports.createValidationResult = createValidationResult;
//# sourceMappingURL=index.js.map