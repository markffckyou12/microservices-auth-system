"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestRedis = exports.createTestDatabase = exports.mockNext = exports.mockResponse = exports.mockRequest = void 0;
const globals_1 = require("@jest/globals");
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
globals_1.jest.mock('bcryptjs', () => ({
    hash: globals_1.jest.fn((password) => Promise.resolve('mock-hashed-password')),
    compare: globals_1.jest.fn((password, hash) => Promise.resolve(true)),
    genSalt: globals_1.jest.fn(() => Promise.resolve('mock-salt')),
    hashSync: globals_1.jest.fn((password) => 'mock-hashed-password'),
    compareSync: globals_1.jest.fn((password, hash) => true)
}));
globals_1.jest.mock('jsonwebtoken', () => ({
    sign: globals_1.jest.fn((payload, secret, options) => 'mock-jwt-token'),
    verify: globals_1.jest.fn((token, secret) => ({
        userId: 'mock-user-id',
        email: 'test@example.com',
        role: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000
    })),
    decode: globals_1.jest.fn((token) => ({
        userId: 'mock-user-id',
        email: 'test@example.com',
        role: 'user'
    }))
}));
globals_1.jest.mock('pg', () => ({
    Pool: globals_1.jest.fn(() => ({
        query: globals_1.jest.fn(() => Promise.resolve({ rows: [], rowCount: 0 })),
        connect: globals_1.jest.fn(() => Promise.resolve({
            query: globals_1.jest.fn(() => Promise.resolve({ rows: [], rowCount: 0 })),
            release: globals_1.jest.fn()
        })),
        end: globals_1.jest.fn(() => Promise.resolve()),
        on: globals_1.jest.fn(),
        off: globals_1.jest.fn()
    }))
}));
globals_1.jest.mock('redis', () => ({
    createClient: globals_1.jest.fn(() => ({
        connect: globals_1.jest.fn(() => Promise.resolve()),
        disconnect: globals_1.jest.fn(() => Promise.resolve()),
        get: globals_1.jest.fn(() => Promise.resolve(null)),
        set: globals_1.jest.fn(() => Promise.resolve('OK')),
        setEx: globals_1.jest.fn(() => Promise.resolve('OK')),
        del: globals_1.jest.fn(() => Promise.resolve(1)),
        exists: globals_1.jest.fn(() => Promise.resolve(0)),
        expire: globals_1.jest.fn(() => Promise.resolve(1)),
        ttl: globals_1.jest.fn(() => Promise.resolve(-1)),
        on: globals_1.jest.fn(),
        off: globals_1.jest.fn()
    }))
}));
globals_1.jest.mock('nodemailer', () => ({
    createTransport: globals_1.jest.fn(() => ({
        sendMail: globals_1.jest.fn(() => Promise.resolve({
            messageId: 'mock-message-id',
            response: 'mock-response'
        })),
        verify: globals_1.jest.fn(() => Promise.resolve(true))
    }))
}));
globals_1.jest.mock('speakeasy', () => ({
    generateSecret: globals_1.jest.fn(() => ({
        ascii: 'mock-secret-ascii',
        hex: 'mock-secret-hex',
        base32: 'mock-secret-base32',
        otpauth_url: 'mock-otpauth-url'
    })),
    totp: globals_1.jest.fn(() => 'mock-totp-code'),
    verify: globals_1.jest.fn(() => true),
    generateSecretASCII: globals_1.jest.fn(() => 'mock-secret-ascii'),
    generateSecretHEX: globals_1.jest.fn(() => 'mock-secret-hex'),
    generateSecretBase32: globals_1.jest.fn(() => 'mock-secret-base32')
}));
globals_1.jest.mock('qrcode', () => ({
    toDataURL: globals_1.jest.fn(() => Promise.resolve('mock-qr-code-data-url')),
    toString: globals_1.jest.fn(() => Promise.resolve('mock-qr-code-string')),
    toFile: globals_1.jest.fn(() => Promise.resolve()),
    toBuffer: globals_1.jest.fn(() => Promise.resolve(Buffer.from('mock-qr-code-buffer')))
}));
globals_1.jest.mock('passport', () => ({
    authenticate: globals_1.jest.fn(() => (req, res, next) => next()),
    use: globals_1.jest.fn(),
    initialize: globals_1.jest.fn(() => (req, res, next) => next()),
    session: globals_1.jest.fn(() => (req, res, next) => next())
}));
globals_1.jest.mock('passport-google-oauth20', () => ({
    Strategy: globals_1.jest.fn()
}));
globals_1.jest.mock('passport-github2', () => ({
    Strategy: globals_1.jest.fn()
}));
globals_1.jest.mock('winston', () => ({
    createLogger: globals_1.jest.fn(() => ({
        info: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        debug: globals_1.jest.fn(),
        log: globals_1.jest.fn()
    })),
    format: {
        combine: globals_1.jest.fn(),
        timestamp: globals_1.jest.fn(),
        errors: globals_1.jest.fn(),
        json: globals_1.jest.fn(),
        simple: globals_1.jest.fn(),
        colorize: globals_1.jest.fn(),
        printf: globals_1.jest.fn()
    },
    transports: {
        Console: globals_1.jest.fn(),
        File: globals_1.jest.fn()
    }
}));
globals_1.jest.mock('express-rate-limit', () => globals_1.jest.fn(() => (req, res, next) => next()));
globals_1.jest.mock('express-slow-down', () => globals_1.jest.fn(() => (req, res, next) => next()));
globals_1.jest.mock('helmet', () => globals_1.jest.fn(() => (req, res, next) => next()));
globals_1.jest.mock('cors', () => globals_1.jest.fn(() => (req, res, next) => next()));
globals_1.jest.mock('compression', () => globals_1.jest.fn(() => (req, res, next) => next()));
globals_1.jest.mock('express-validator', () => ({
    body: globals_1.jest.fn(() => (req, res, next) => next()),
    param: globals_1.jest.fn(() => (req, res, next) => next()),
    query: globals_1.jest.fn(() => (req, res, next) => next()),
    validationResult: globals_1.jest.fn(() => ({
        isEmpty: () => true,
        array: () => []
    }))
}));
globals_1.jest.mock('@auth-system/shared', () => ({
    createSuccessResponse: globals_1.jest.fn((data) => ({ success: true, data })),
    createErrorResponse: globals_1.jest.fn((message) => ({ success: false, message })),
    createApiError: globals_1.jest.fn((code, message) => ({ code, message })),
    isValidEmail: globals_1.jest.fn(() => true),
    isValidPassword: globals_1.jest.fn(() => true),
    generateSecureToken: globals_1.jest.fn(() => 'mock-secure-token'),
    createRateLimitKey: globals_1.jest.fn((identifier, action) => `rate_limit:${identifier}:${action}`),
    createLogEntry: globals_1.jest.fn((level, message) => ({ level, message, timestamp: new Date().toISOString() })),
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
global.console = {
    ...console,
    log: globals_1.jest.fn(),
    debug: globals_1.jest.fn(),
    info: globals_1.jest.fn(),
    warn: globals_1.jest.fn(),
    error: globals_1.jest.fn()
};
const mockRequest = (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    userAgent: 'test-user-agent',
    ...overrides
});
exports.mockRequest = mockRequest;
const mockResponse = () => {
    const res = {};
    res.status = globals_1.jest.fn().mockReturnValue(res);
    res.json = globals_1.jest.fn().mockReturnValue(res);
    res.send = globals_1.jest.fn().mockReturnValue(res);
    res.setHeader = globals_1.jest.fn().mockReturnValue(res);
    res.cookie = globals_1.jest.fn().mockReturnValue(res);
    res.clearCookie = globals_1.jest.fn().mockReturnValue(res);
    return res;
};
exports.mockResponse = mockResponse;
exports.mockNext = globals_1.jest.fn();
const createTestDatabase = async () => {
    return {
        query: globals_1.jest.fn(() => Promise.resolve({ rows: [], rowCount: 0 })),
        connect: globals_1.jest.fn(() => Promise.resolve()),
        end: globals_1.jest.fn(() => Promise.resolve())
    };
};
exports.createTestDatabase = createTestDatabase;
const createTestRedis = async () => {
    return {
        get: globals_1.jest.fn(() => Promise.resolve(null)),
        set: globals_1.jest.fn(() => Promise.resolve('OK')),
        setEx: globals_1.jest.fn(() => Promise.resolve('OK')),
        del: globals_1.jest.fn(() => Promise.resolve(1)),
        connect: globals_1.jest.fn(() => Promise.resolve()),
        disconnect: globals_1.jest.fn(() => Promise.resolve())
    };
};
exports.createTestRedis = createTestRedis;
//# sourceMappingURL=setup.js.map