"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const user_1 = __importDefault(require("./user"));
const password_1 = __importDefault(require("./password"));
const setupRoutes = (app, db) => {
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'healthy',
            service: 'user-service',
            timestamp: new Date().toISOString()
        });
    });
    app.get('/api/v1/users/status', (req, res) => {
        res.status(200).json({
            message: 'User Service is running',
            version: '1.0.0'
        });
    });
    app.use('/api/v1/users', (0, user_1.default)(db));
    app.use('/api/v1/password', (0, password_1.default)(db));
};
exports.setupRoutes = setupRoutes;
//# sourceMappingURL=index.js.map