"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.getDatabase = exports.setupDatabase = void 0;
const pg_1 = require("pg");
let pool;
const setupDatabase = async () => {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'auth_system',
        user: process.env.DB_USER || 'auth_user',
        password: process.env.DB_PASSWORD || 'auth_password',
        max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000')
    };
    pool = new pg_1.Pool(config);
    // Test the connection
    try {
        const client = await pool.connect();
        client.release();
        console.log('Database connection established successfully');
    }
    catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
};
exports.setupDatabase = setupDatabase;
const getDatabase = () => {
    if (!pool) {
        throw new Error('Database not initialized. Call setupDatabase() first.');
    }
    return pool;
};
exports.getDatabase = getDatabase;
const closeDatabase = async () => {
    if (pool) {
        await pool.end();
        console.log('Database connection closed');
    }
};
exports.closeDatabase = closeDatabase;
//# sourceMappingURL=database.js.map