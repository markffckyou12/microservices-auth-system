"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
const routes_1 = require("./routes");
const authorization_1 = require("./middleware/authorization");
const rbac_1 = require("./services/rbac");
const audit_1 = require("./services/audit");
const password_1 = require("./services/password");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3003;
const db = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'auth_system',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
const rbacService = new rbac_1.RBACService(db);
const auditService = new audit_1.AuditServiceImpl(db);
const passwordService = new password_1.PasswordServiceImpl(db);
const authMiddleware = new authorization_1.AuthorizationMiddleware(rbacService, auditService);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'user-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        features: {
            rbac: true,
            audit: true,
            authorization: true,
            password: true
        }
    });
});
const apiRouter = (0, routes_1.setupRoutes)(db);
app.use('/api/v1', apiRouter);
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await db.end();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await db.end();
    process.exit(0);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
app.listen(port, () => {
    console.log(`User Service started on port ${port}`);
    console.log(`Health check available at http://localhost:${port}/health`);
    console.log(`API available at http://localhost:${port}/api/v1`);
    console.log('Phase 3 Features:');
    console.log('  ✅ RBAC System');
    console.log('  ✅ Audit Logging');
    console.log('  ✅ Authorization Middleware');
    console.log('  ✅ Password Management');
});
exports.default = app;
//# sourceMappingURL=index.js.map