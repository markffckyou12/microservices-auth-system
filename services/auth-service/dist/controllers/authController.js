"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const database_1 = require("../config/database");
const auth_1 = require("../utils/auth");
const uuid_1 = require("uuid");
const register = async (req, res) => {
    const { email, username, password, firstName, lastName } = req.body;
    if (!email || !username || !password || !firstName || !lastName) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    try {
        const db = (0, database_1.getDatabase)();
        const existing = await db.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Email or username already exists' });
        }
        const passwordHash = await (0, auth_1.hashPassword)(password);
        const id = (0, uuid_1.v4)();
        await db.query('INSERT INTO users (id, email, username, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6)', [id, email, username, passwordHash, firstName, lastName]);
        return res.status(201).json({ success: true, message: 'User registered successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Registration failed', error });
    }
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Missing email or password' });
    }
    try {
        const db = (0, database_1.getDatabase)();
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const user = result.rows[0];
        const valid = await (0, auth_1.comparePassword)(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = (0, auth_1.signJwt)({ userId: user.id, email: user.email, role: 'user' });
        return res.status(200).json({ success: true, token });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Login failed', error });
    }
};
exports.login = login;
//# sourceMappingURL=authController.js.map