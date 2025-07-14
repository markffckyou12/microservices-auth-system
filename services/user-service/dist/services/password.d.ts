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
    validatePasswordStrength(password: string): PasswordStrength;
    checkPasswordHistory(userId: string, password: string): Promise<boolean>;
    addToPasswordHistory(userId: string, passwordHash: string): Promise<void>;
    generatePasswordResetToken(userId: string): Promise<string>;
    verifyPasswordResetToken(token: string): Promise<string | null>;
    markPasswordResetTokenUsed(token: string): Promise<void>;
    sendPasswordResetEmail(email: string, resetUrl: string): Promise<void>;
    checkAccountLockout(userId: string): Promise<{
        isLocked: boolean;
        remainingTime?: number;
    }>;
    incrementFailedAttempts(userId: string): Promise<void>;
    resetFailedAttempts(userId: string): Promise<void>;
}
export default PasswordService;
//# sourceMappingURL=password.d.ts.map