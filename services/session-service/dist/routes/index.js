"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const session_1 = __importDefault(require("./session"));
const setupRoutes = (app, redis) => {
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'healthy',
            service: 'session-service',
            timestamp: new Date().toISOString()
        });
    });
    app.get('/api/v1/sessions/status', (req, res) => {
        res.status(200).json({
            message: 'Session Service is running',
            version: '1.0.0'
        });
    });
    app.use('/api/v1/sessions', (0, session_1.default)(redis));
};
exports.setupRoutes = setupRoutes;
//# sourceMappingURL=index.js.map