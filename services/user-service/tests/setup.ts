import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password: string) => Promise.resolve('mock-hashed-password')),
  compare: jest.fn((password: string, hash: string) => Promise.resolve(true)),
  genSalt: jest.fn(() => Promise.resolve('mock-salt')),
  hashSync: jest.fn((password: string) => 'mock-hashed-password'),
  compareSync: jest.fn((password: string, hash: string) => true)
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload: any, secret: string, options?: any) => 'mock-jwt-token'),
  verify: jest.fn((token: string, secret: string) => ({
    userId: 'mock-user-id',
    email: 'test@example.com',
    role: 'user',
    iat: Date.now(),
    exp: Date.now() + 3600000
  })),
  decode: jest.fn((token: string) => ({
    userId: 'mock-user-id',
    email: 'test@example.com',
    role: 'user'
  }))
}));

// Mock pg (PostgreSQL)
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(() => Promise.resolve({ rows: [], rowCount: 0 })),
    connect: jest.fn(() => Promise.resolve({
      query: jest.fn(() => Promise.resolve({ rows: [], rowCount: 0 })),
      release: jest.fn()
    })),
    end: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    off: jest.fn()
  }))
}));

// Mock redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(() => Promise.resolve()),
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    setEx: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1)),
    exists: jest.fn(() => Promise.resolve(0)),
    expire: jest.fn(() => Promise.resolve(1)),
    ttl: jest.fn(() => Promise.resolve(-1)),
    on: jest.fn(),
    off: jest.fn()
  }))
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({
      messageId: 'mock-message-id',
      response: 'mock-response'
    })),
    verify: jest.fn(() => Promise.resolve(true))
  }))
}));

// Mock speakeasy (TOTP)
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(() => ({
    ascii: 'mock-secret-ascii',
    hex: 'mock-secret-hex',
    base32: 'mock-secret-base32',
    otpauth_url: 'mock-otpauth-url'
  })),
  totp: jest.fn(() => 'mock-totp-code'),
  verify: jest.fn(() => true),
  generateSecretASCII: jest.fn(() => 'mock-secret-ascii'),
  generateSecretHEX: jest.fn(() => 'mock-secret-hex'),
  generateSecretBase32: jest.fn(() => 'mock-secret-base32')
}));

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('mock-qr-code-data-url')),
  toString: jest.fn(() => Promise.resolve('mock-qr-code-string')),
  toFile: jest.fn(() => Promise.resolve()),
  toBuffer: jest.fn(() => Promise.resolve(Buffer.from('mock-qr-code-buffer')))
}));

// Mock passport
jest.mock('passport', () => ({
  authenticate: jest.fn(() => (req: any, res: any, next: any) => next()),
  use: jest.fn(),
  initialize: jest.fn(() => (req: any, res: any, next: any) => next()),
  session: jest.fn(() => (req: any, res: any, next: any) => next())
}));

// Mock passport strategies
jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn()
}));

jest.mock('passport-github2', () => ({
  Strategy: jest.fn()
}));

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    simple: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}));

// Mock express middleware
jest.mock('express-rate-limit', () => jest.fn(() => (req: any, res: any, next: any) => next()));
jest.mock('express-slow-down', () => jest.fn(() => (req: any, res: any, next: any) => next()));
jest.mock('helmet', () => jest.fn(() => (req: any, res: any, next: any) => next()));
jest.mock('cors', () => jest.fn(() => (req: any, res: any, next: any) => next()));
jest.mock('compression', () => jest.fn(() => (req: any, res: any, next: any) => next()));

// Mock express-validator
jest.mock('express-validator', () => ({
  body: jest.fn(() => (req: any, res: any, next: any) => next()),
  param: jest.fn(() => (req: any, res: any, next: any) => next()),
  query: jest.fn(() => (req: any, res: any, next: any) => next()),
  validationResult: jest.fn(() => ({
    isEmpty: () => true,
    array: () => []
  }))
}));

// Mock shared package
jest.mock('@auth-system/shared', () => ({
  createSuccessResponse: jest.fn((data: any) => ({ success: true, data })),
  createErrorResponse: jest.fn((message: string) => ({ success: false, message })),
  createApiError: jest.fn((code: string, message: string) => ({ code, message })),
  isValidEmail: jest.fn(() => true),
  isValidPassword: jest.fn(() => true),
  generateSecureToken: jest.fn(() => 'mock-secure-token'),
  createRateLimitKey: jest.fn((identifier: string, action: string) => `rate_limit:${identifier}:${action}`),
  createLogEntry: jest.fn((level: string, message: string) => ({ level, message, timestamp: new Date().toISOString() })),
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  },
  ERROR_CODES: {
    INVALID_CREDENTIALS: 'AUTH_001',
    USER_NOT_FOUND: 'AUTH_002',
    TOKEN_EXPIRED: 'AUTH_005',
    TOKEN_INVALID: 'AUTH_006'
  }
}));

// Global test utilities
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock request and response objects
export const mockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ip: '127.0.0.1',
  userAgent: 'test-user-agent',
  ...overrides
});

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext = jest.fn();

// Test database utilities
export const createTestDatabase = async () => {
  // Mock database setup for tests
  return {
    query: jest.fn(() => Promise.resolve({ rows: [], rowCount: 0 })),
    connect: jest.fn(() => Promise.resolve()),
    end: jest.fn(() => Promise.resolve())
  };
};

export const createTestRedis = async () => {
  // Mock Redis setup for tests
  return {
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    setEx: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1)),
    connect: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(() => Promise.resolve())
  };
}; 