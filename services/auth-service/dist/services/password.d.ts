import { Pool } from 'pg';
export interface PasswordResetToken {
    userId: string;
    token: string;
    expiresAt: Date;
    used: boolean;
}
export interface PasswordHistory {
    userId: string;
    passwordHash: string;
    createdAt: Date;
}
export interface PasswordStrength {
    score: number;
    feedback: string[];
    isStrong: boolean;
}
export declare class PasswordService {
    private db;
    private emailTransporter;
    constructor(db: Pool);
    /**
     * Validate password strength
     */
    validatePasswordStrength(password: string): PasswordStrength;
    /**
     * Check if password was used recently
     */
    checkPasswordHistory(userId: string, password: string): Promise<boolean>;
    /**
     * Add password to history
     */
    addToPasswordHistory(userId: string, passwordHash: string): Promise<void>;
    /**
     * Generate password reset token
     */
    generatePasswordResetToken(userId: string): Promise<string>;
    /**
     * Verify password reset token
     */
    verifyPasswordResetToken(token: string): Promise<string | null>;
    /**
     * Mark password reset token as used
     */
    markPasswordResetTokenUsed(token: string): Promise<void>;
    /**
     * Send password reset email
     */
    sendPasswordResetEmail(email: string, resetUrl: string): Promise<void>;
    /**
     * Check account lockout status
     */
    checkAccountLockout(userId: string): Promise<{
        isLocked: boolean;
        remainingTime?: number;
    }>;
    /**
     * Increment failed login attempts
     */
    incrementFailedAttempts(userId: string): Promise<void>;
    /**
     * Reset failed login attempts
     */
    resetFailedAttempts(userId: string): Promise<void>;
}
export default PasswordService;
//# sourceMappingURL=password.d.ts.map