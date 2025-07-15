// ALL MOCKS FIRST, BEFORE ANY IMPORTS!
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(() => ({
    ascii: 'mock-secret',
    base32: 'mock-secret-base32',
    otpauth_url: 'otpauth://totp/MockApp:mockuser?secret=mock-secret&issuer=MockApp'
  })),
  totp: {
    verify: jest.fn(() => true)
  }
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('mock-qr-code-data-url'))
}));

jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn()
  }))
}));

jest.mock('passport', () => ({
  use: jest.fn(),
  authenticate: jest.fn(() => (req: any, res: any, next: any) => next())
}));

jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn()
}));

jest.mock('passport-github2', () => ({
  Strategy: jest.fn()
}));

// NOW IMPORTS
import { OAuthService } from '../../src/services/oauth';
import { MFAService } from '../../src/services/mfa';
import { Pool } from 'pg';


describe('Auth Service Integration Tests', () => {
  let oauthService: OAuthService;
  let mfaService: MFAService;
  let mockDb: jest.Mocked<Pool>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = new Pool() as jest.Mocked<Pool>;
    oauthService = OAuthService.getInstance();
    mfaService = new MFAService(mockDb);
  });

  describe('OAuth Service', () => {
    it('should be a singleton instance', () => {
      const instance1 = OAuthService.getInstance();
      const instance2 = OAuthService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize passport strategies', () => {
      expect(oauthService).toBeDefined();
      expect(oauthService.getPassport).toBeDefined();
    });

    it('should provide authentication methods', () => {
      const passport = require('passport');
      passport.authenticate.mockReturnValue(() => (req: any, res: any, next: any) => next());

      const googleAuth = oauthService.authenticate('google');
      const githubAuth = oauthService.authenticate('github');
      
      expect(googleAuth).toBeDefined();
      expect(githubAuth).toBeDefined();
    });

    it('should provide callback authentication methods', () => {
      const passport = require('passport');
      passport.authenticate.mockReturnValue(() => (req: any, res: any, next: any) => next());

      const googleCallback = oauthService.authenticateCallback('google');
      const githubCallback = oauthService.authenticateCallback('github');
      
      expect(googleCallback).toBeDefined();
      expect(githubCallback).toBeDefined();
    });
  });

  describe('MFA Service', () => {
    it('should generate TOTP secret successfully', async () => {
      const result = await mfaService.generateTOTPSecret('user-1', 'test@example.com');
      
      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('backupCodes');
      expect(result.backupCodes).toHaveLength(10);
      expect(result.secret).toBe('mock-secret-base32');
    });

    it('should verify TOTP token', () => {
      const isValid = mfaService.verifyTOTPToken('mock-secret', '123456');
      expect(isValid).toBe(true);
    });

    it('should verify backup code', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({
          rows: [{
            backup_codes: ['backup-code-1', 'backup-code-2']
          }]
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockDb.query = mockQuery;

      const isValid = await mfaService.verifyBackupCode('user-1', 'backup-code-1');
      expect(isValid).toBe(true);
    });

    it('should store MFA setup', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ rowCount: 1 });
      mockDb.query = mockQuery;

      await mfaService.storeMFASetup('user-1', 'mock-secret', ['backup-1', 'backup-2']);
      
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO mfa_setup'),
        ['user-1', 'mock-secret', ['backup-1', 'backup-2']]
      );
    });

    it('should check if MFA is enabled', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({
          rows: [{ is_enabled: true }]
        });

      mockDb.query = mockQuery;

      const isEnabled = await mfaService.isMFAEnabled('user-1');
      expect(isEnabled).toBe(true);
    });

    it('should disable MFA', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ rowCount: 1 });
      mockDb.query = mockQuery;

      await mfaService.disableMFA('user-1');
      
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE mfa_setup SET is_enabled = false'),
        ['user-1']
      );
    });

    it('should generate SMS token', () => {
      const token = mfaService.generateSMSToken();
      expect(token).toMatch(/^\d{6}$/);
    });

    it('should store SMS token', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ rowCount: 1 });
      mockDb.query = mockQuery;

      await mfaService.storeSMSToken('user-1', '123456');
      
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO mfa_tokens'),
        expect.arrayContaining(['user-1', '123456'])
      );
    });

    it('should verify SMS token', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({
          rows: [{ id: 'token-1' }]
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockDb.query = mockQuery;

      const isValid = await mfaService.verifySMSToken('user-1', '123456');
      expect(isValid).toBe(true);
    });
  });

  describe('Service Integration', () => {
    it('should work together for MFA setup flow', async () => {
      const mfaSecret = await mfaService.generateTOTPSecret('user-1', 'test@example.com');
      expect(mfaSecret.secret).toBeDefined();
      expect(mfaSecret.backupCodes).toHaveLength(10);

      const mockQuery = jest.fn().mockResolvedValue({ rowCount: 1 });
      mockDb.query = mockQuery;

      await mfaService.storeMFASetup('user-1', mfaSecret.secret, mfaSecret.backupCodes);
      expect(mockDb.query).toHaveBeenCalled();

      const isValidToken = mfaService.verifyTOTPToken(mfaSecret.secret, '123456');
      expect(isValidToken).toBe(true);

      const mockBackupQuery = jest.fn()
        .mockResolvedValueOnce({
          rows: [{ backup_codes: mfaSecret.backupCodes }]
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockDb.query = mockBackupQuery;

      const isValidBackup = await mfaService.verifyBackupCode('user-1', mfaSecret.backupCodes[0]);
      expect(isValidBackup).toBe(true);
    });
  });
});
