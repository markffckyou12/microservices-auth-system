"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupErrorHandling = void 0;
const setupErrorHandling = (app) => {
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Route not found',
            path: req.path
        });
    });
    // Global error handler
    app.use((error, req, res, next) => {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    });
};
exports.setupErrorHandling = setupErrorHandling;
//# sourceMappingURL=errorHandler.js.map