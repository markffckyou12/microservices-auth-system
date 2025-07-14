"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./config/logger");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const middleware_1 = require("./middleware");
const routes_1 = require("./routes");
const errorHandler_1 = require("./middleware/errorHandler");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const logger = (0, logger_1.createLogger)();
const port = process.env.PORT || 3001;
// Initialize services
async function initializeServices() {
    try {
        // Setup database connection
        await (0, database_1.setupDatabase)();
        const db = (0, database_1.getDatabase)();
        logger.info('Database connection established');
        // Setup Redis connection
        await (0, redis_1.setupRedis)();
        const redis = (0, redis_1.getRedis)();
        logger.info('Redis connection established');
        // Setup middleware
        (0, middleware_1.setupMiddleware)(app);
        logger.info('Middleware setup complete');
        // Setup routes with database and Redis connections
        (0, routes_1.setupRoutes)(app, db, redis);
        logger.info('Routes setup complete');
        // Setup error handling
        (0, errorHandler_1.setupErrorHandling)(app);
        logger.info('Error handling setup complete');
        // Health check endpoint
        app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                service: 'auth-service',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0'
            });
        });
        // Start server
        app.listen(port, () => {
            logger.info(`Auth Service started on port ${port}`);
            logger.info(`Health check available at http://localhost:${port}/health`);
        });
    }
    catch (error) {
        logger.error('Failed to initialize services:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Initialize the application
initializeServices().catch((error) => {
    logger.error('Failed to start Auth Service:', error);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map