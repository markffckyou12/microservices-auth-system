"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const MIGRATIONS_DIR = path_1.default.join(__dirname, '../db/migrations');
const runMigrations = async () => {
    const pool = new pg_1.Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'auth_system',
        user: process.env.DB_USER || 'auth_user',
        password: process.env.DB_PASSWORD || 'auth_password',
    });
    try {
        const files = fs_1.default.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'));
        for (const file of files) {
            const sql = fs_1.default.readFileSync(path_1.default.join(MIGRATIONS_DIR, file), 'utf-8');
            await pool.query(sql);
            console.log(`Migration ${file} executed successfully.`);
        }
        await pool.end();
        console.log('All migrations executed.');
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};
runMigrations();
//# sourceMappingURL=migrate.js.map