import { Pool } from 'pg';
export interface MFASecret {
    secret: string;
    qrCode: string;
    backupCodes: string[];
}
export interface MFASetup {
    userId: string;
    secret: string;
    backupCodes: string[];
    isEnabled: boolean;
    createdAt: Date;
}
export interface MFAToken {
    userId: string;
    token: string;
    type: 'totp' | 'sms' | 'backup';
    expiresAt: Date;
    used: boolean;
}
export declare class MFAService {
    private db;
    constructor(db: Pool);
    /**
     * Generate TOTP secret and QR code for user
     */
    generateTOTPSecret(userId: string, email: string): Promise<MFASecret>;
    /**
     * Verify TOTP token
     */
    verifyTOTPToken(secret: string, token: string): boolean;
    /**
     * Generate backup codes
     */
    private generateBackupCodes;
    /**
     * Verify backup code
     */
    verifyBackupCode(userId: string, code: string): Promise<boolean>;
    /**
     * Generate SMS token
     */
    generateSMSToken(): string;
    /**
     * Store MFA setup in database
     */
    storeMFASetup(userId: string, secret: string, backupCodes: string[]): Promise<void>;
    /**
     * Check if MFA is enabled for user
     */
    isMFAEnabled(userId: string): Promise<boolean>;
    /**
     * Disable MFA for user
     */
    disableMFA(userId: string): Promise<void>;
    /**
     * Store SMS token
     */
    storeSMSToken(userId: string, token: string): Promise<void>;
    /**
     * Verify SMS token
     */
    verifySMSToken(userId: string, token: string): Promise<boolean>;
}
export default MFAService;
//# sourceMappingURL=mfa.d.ts.map