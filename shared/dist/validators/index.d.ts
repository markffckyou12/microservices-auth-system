import { z } from 'zod';
import { OAuthProvider, MFAType } from '../types';
export declare const userRegistrationSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
}, {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
}>, {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
}, {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
}>;
export declare const userLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const userUpdateSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    preferences: z.ZodOptional<z.ZodObject<{
        theme: z.ZodOptional<z.ZodEnum<["light", "dark", "system"]>>;
        language: z.ZodOptional<z.ZodString>;
        timezone: z.ZodOptional<z.ZodString>;
        notifications: z.ZodOptional<z.ZodObject<{
            email: z.ZodOptional<z.ZodBoolean>;
            push: z.ZodOptional<z.ZodBoolean>;
            sms: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            sms?: boolean | undefined;
            email?: boolean | undefined;
            push?: boolean | undefined;
        }, {
            sms?: boolean | undefined;
            email?: boolean | undefined;
            push?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        theme?: "light" | "dark" | "system" | undefined;
        language?: string | undefined;
        timezone?: string | undefined;
        notifications?: {
            sms?: boolean | undefined;
            email?: boolean | undefined;
            push?: boolean | undefined;
        } | undefined;
    }, {
        theme?: "light" | "dark" | "system" | undefined;
        language?: string | undefined;
        timezone?: string | undefined;
        notifications?: {
            sms?: boolean | undefined;
            email?: boolean | undefined;
            push?: boolean | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    username?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    preferences?: {
        theme?: "light" | "dark" | "system" | undefined;
        language?: string | undefined;
        timezone?: string | undefined;
        notifications?: {
            sms?: boolean | undefined;
            email?: boolean | undefined;
            push?: boolean | undefined;
        } | undefined;
    } | undefined;
}, {
    username?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    preferences?: {
        theme?: "light" | "dark" | "system" | undefined;
        language?: string | undefined;
        timezone?: string | undefined;
        notifications?: {
            sms?: boolean | undefined;
            email?: boolean | undefined;
            push?: boolean | undefined;
        } | undefined;
    } | undefined;
}>;
export declare const passwordChangeSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmNewPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}>;
export declare const passwordResetRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const passwordResetSchema: z.ZodEffects<z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
    confirmNewPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPassword: string;
    confirmNewPassword: string;
    token: string;
}, {
    newPassword: string;
    confirmNewPassword: string;
    token: string;
}>, {
    newPassword: string;
    confirmNewPassword: string;
    token: string;
}, {
    newPassword: string;
    confirmNewPassword: string;
    token: string;
}>;
export declare const oAuthLoginSchema: z.ZodObject<{
    provider: z.ZodNativeEnum<typeof OAuthProvider>;
    code: z.ZodString;
    state: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    provider: OAuthProvider;
    state?: string | undefined;
}, {
    code: string;
    provider: OAuthProvider;
    state?: string | undefined;
}>;
export declare const mfaSetupSchema: z.ZodObject<{
    type: z.ZodNativeEnum<typeof MFAType>;
    identifier: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: MFAType;
    identifier?: string | undefined;
}, {
    type: MFAType;
    identifier?: string | undefined;
}>;
export declare const mfaVerifySchema: z.ZodObject<{
    type: z.ZodNativeEnum<typeof MFAType>;
    code: z.ZodString;
    identifier: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    type: MFAType;
    identifier?: string | undefined;
}, {
    code: string;
    type: MFAType;
    identifier?: string | undefined;
}>;
export declare const mfaDisableSchema: z.ZodObject<{
    type: z.ZodNativeEnum<typeof MFAType>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    type: MFAType;
}, {
    password: string;
    type: MFAType;
}>;
export declare const sessionCreateSchema: z.ZodObject<{
    userId: z.ZodString;
    ipAddress: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}, {
    userId: string;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}>;
export declare const sessionRefreshSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const rateLimitConfigSchema: z.ZodObject<{
    windowMs: z.ZodNumber;
    maxRequests: z.ZodNumber;
    message: z.ZodOptional<z.ZodString>;
    statusCode: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    windowMs: number;
    maxRequests: number;
    statusCode: number;
    message?: string | undefined;
}, {
    windowMs: number;
    maxRequests: number;
    message?: string | undefined;
    statusCode?: number | undefined;
}>;
export declare const healthCheckSchema: z.ZodObject<{
    service: z.ZodString;
    status: z.ZodEnum<["healthy", "unhealthy", "degraded"]>;
    responseTime: z.ZodNumber;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status: "healthy" | "unhealthy" | "degraded";
    service: string;
    responseTime: number;
    details?: Record<string, any> | undefined;
}, {
    status: "healthy" | "unhealthy" | "degraded";
    service: string;
    responseTime: number;
    details?: Record<string, any> | undefined;
}>;
export declare const validateUserRegistration: (data: unknown) => {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
};
export declare const validateUserLogin: (data: unknown) => {
    email: string;
    password: string;
};
export declare const validateUserUpdate: (data: unknown) => {
    username?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    preferences?: {
        theme?: "light" | "dark" | "system" | undefined;
        language?: string | undefined;
        timezone?: string | undefined;
        notifications?: {
            sms?: boolean | undefined;
            email?: boolean | undefined;
            push?: boolean | undefined;
        } | undefined;
    } | undefined;
};
export declare const validatePasswordChange: (data: unknown) => {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
};
export declare const validatePasswordResetRequest: (data: unknown) => {
    email: string;
};
export declare const validatePasswordReset: (data: unknown) => {
    newPassword: string;
    confirmNewPassword: string;
    token: string;
};
export declare const validateOAuthLogin: (data: unknown) => {
    code: string;
    provider: OAuthProvider;
    state?: string | undefined;
};
export declare const validateMFASetup: (data: unknown) => {
    type: MFAType;
    identifier?: string | undefined;
};
export declare const validateMFAVerify: (data: unknown) => {
    code: string;
    type: MFAType;
    identifier?: string | undefined;
};
export declare const validateMFADisable: (data: unknown) => {
    password: string;
    type: MFAType;
};
export declare const validateSessionCreate: (data: unknown) => {
    userId: string;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
};
export declare const validateSessionRefresh: (data: unknown) => {
    refreshToken: string;
};
export declare const validatePagination: (data: unknown) => {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
};
export declare const validateRateLimitConfig: (data: unknown) => {
    windowMs: number;
    maxRequests: number;
    statusCode: number;
    message?: string | undefined;
};
export declare const validateHealthCheck: (data: unknown) => {
    status: "healthy" | "unhealthy" | "degraded";
    service: string;
    responseTime: number;
    details?: Record<string, any> | undefined;
};
//# sourceMappingURL=index.d.ts.map