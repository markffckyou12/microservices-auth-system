import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
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

export class MFAService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Generate TOTP secret and QR code for user
   */
  public async generateTOTPSecret(userId: string, email: string): Promise<MFASecret> {
    const secret = speakeasy.generateSecret({
      name: `Auth System (${email})`,
      issuer: 'Auth System',
      length: 32
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');
    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.base32 || '',
      qrCode,
      backupCodes
    };
  }

  /**
   * Verify TOTP token
   */
  public verifyTOTPToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps tolerance
    });
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(speakeasy.generateSecret({ length: 8 }).base32?.substring(0, 8) || '');
    }
    return codes;
  }

  /**
   * Verify backup code
   */
  public verifyBackupCode(userId: string, code: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        const result = await this.db.query(
          'SELECT backup_codes FROM mfa_setup WHERE user_id = $1 AND is_enabled = true',
          [userId]
        );

        if (result.rows.length === 0) {
          resolve(false);
          return;
        }

        const backupCodes = result.rows[0].backup_codes || [];
        const isValid = backupCodes.includes(code);

        if (isValid) {
          // Remove used backup code
          const updatedCodes = backupCodes.filter((c: string) => c !== code);
          await this.db.query(
            'UPDATE mfa_setup SET backup_codes = $1 WHERE user_id = $2',
            [updatedCodes, userId]
          );
        }

        resolve(isValid);
      } catch (error) {
        console.error('Error verifying backup code:', error);
        resolve(false);
      }
    });
  }

  /**
   * Generate SMS token
   */
  public generateSMSToken(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store MFA setup in database
   */
  public async storeMFASetup(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    await this.db.query(
      `INSERT INTO mfa_setup (user_id, secret, backup_codes, is_enabled, created_at)
       VALUES ($1, $2, $3, true, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         secret = $2, 
         backup_codes = $3, 
         is_enabled = true, 
         updated_at = NOW()`,
      [userId, secret, backupCodes]
    );
  }

  /**
   * Check if MFA is enabled for user
   */
  public async isMFAEnabled(userId: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT is_enabled FROM mfa_setup WHERE user_id = $1',
      [userId]
    );
    return result.rows.length > 0 && result.rows[0].is_enabled;
  }

  /**
   * Disable MFA for user
   */
  public async disableMFA(userId: string): Promise<void> {
    await this.db.query(
      'UPDATE mfa_setup SET is_enabled = false, updated_at = NOW() WHERE user_id = $1',
      [userId]
    );
  }

  /**
   * Store SMS token
   */
  public async storeSMSToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await this.db.query(
      `INSERT INTO mfa_tokens (user_id, token, type, expires_at)
       VALUES ($1, $2, 'sms', $3)`,
      [userId, token, expiresAt]
    );
  }

  /**
   * Verify SMS token
   */
  public async verifySMSToken(userId: string, token: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT * FROM mfa_tokens 
       WHERE user_id = $1 AND token = $2 AND type = 'sms' 
       AND expires_at > NOW() AND used = false`,
      [userId, token]
    );

    if (result.rows.length === 0) {
      return false;
    }

    // Mark token as used
    await this.db.query(
      'UPDATE mfa_tokens SET used = true WHERE user_id = $1 AND token = $2',
      [userId, token]
    );

    return true;
  }
}

export default MFAService; 