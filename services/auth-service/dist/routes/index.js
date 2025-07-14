"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const authController_1 = require("../controllers/authController");
const express_validator_1 = require("express-validator");
// Import Phase 2 routes
const oauth_1 = __importDefault(require("./oauth"));
const mfa_1 = __importDefault(require("./mfa"));
const setupRoutes = (app, db, redis) => {
    // Health check route
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'healthy',
            service: 'auth-service',
            timestamp: new Date().toISOString()
        });
    });
    // Basic Auth endpoints
    app.post('/api/v1/auth/register', [
        (0, express_validator_1.body)('email').isEmail(),
        (0, express_validator_1.body)('username').isLength({ min: 3, max: 30 }),
        (0, express_validator_1.body)('password').isLength({ min: 8 }),
        (0, express_validator_1.body)('firstName').notEmpty(),
        (0, express_validator_1.body)('lastName').notEmpty()
    ], authController_1.register);
    app.post('/api/v1/auth/login', [
        (0, express_validator_1.body)('email').isEmail(),
        (0, express_validator_1.body)('password').isLength({ min: 8 })
    ], authController_1.login);
    // API status route
    app.get('/api/v1/auth/status', (req, res) => {
        res.status(200).json({
            message: 'Auth Service is running',
            version: '1.0.0'
        });
    });
    // Phase 2: OAuth Routes
    app.use('/api/v1/auth/oauth', (0, oauth_1.default)(db));
    // Phase 2: MFA Routes
    app.use('/api/v1/auth/mfa', (0, mfa_1.default)(db));
};
exports.setupRoutes = setupRoutes;
//# sourceMappingURL=index.js.map