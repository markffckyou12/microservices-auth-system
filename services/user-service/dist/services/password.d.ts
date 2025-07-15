import { Pool } from 'pg';
export interface PasswordResetToken {
    id: string;
    user_id: string;
    token: string;
    expires_at: Date;
    used: boolean;
    created_at: Date;
}
export interface PasswordService {
    requestPasswordReset(email: string): Promise<boolean>;
    resetPassword(token: string, newPassword: string): Promise<boolean>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>;
    validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
    };
    checkPasswordHistory(userId: string, newPassword: string): Promise<boolean>;
    sendPasswordResetEmail(email: string, token: string): Promise<void>;
    generatePasswordResetToken(userId: string): Promise<string>;
}
export declare class PasswordServiceImpl implements PasswordService {
    private db;
    constructor(db: Pool);
    requestPasswordReset(email: string): Promise<boolean>;
    resetPassword(token: string, newPassword: string): Promise<boolean>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>;
    validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
    };
    checkPasswordHistory(userId: string, newPassword: string): Promise<boolean>;
    sendPasswordResetEmail(email: string, token: string): Promise<void>;
    generatePasswordResetToken(userId: string): Promise<string>;
    private generateResetToken;
}
//# sourceMappingURL=password.d.ts.map