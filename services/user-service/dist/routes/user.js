"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createUserRoutes;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
function createUserRoutes(db) {
    const router = (0, express_1.Router)();
    router.get('/profile', async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const result = await db.query('SELECT id, email, username, first_name, last_name, created_at, updated_at FROM users WHERE id = $1', [userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            return res.json({ success: true, data: result.rows[0] });
        }
        catch (error) {
            console.error('Error getting user profile:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
    router.put('/profile', [
        (0, express_validator_1.body)('firstName').optional().isLength({ min: 1, max: 50 }),
        (0, express_validator_1.body)('lastName').optional().isLength({ min: 1, max: 50 }),
        (0, express_validator_1.body)('username').optional().isLength({ min: 3, max: 30 })
    ], async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { firstName, lastName, username } = req.body;
            const updateFields = [];
            const values = [];
            let paramCount = 1;
            if (firstName) {
                updateFields.push(`first_name = $${paramCount}`);
                values.push(firstName);
                paramCount++;
            }
            if (lastName) {
                updateFields.push(`last_name = $${paramCount}`);
                values.push(lastName);
                paramCount++;
            }
            if (username) {
                updateFields.push(`username = $${paramCount}`);
                values.push(username);
                paramCount++;
            }
            if (updateFields.length === 0) {
                return res.status(400).json({ success: false, message: 'No fields to update' });
            }
            values.push(userId);
            const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING id, email, username, first_name, last_name, created_at, updated_at`;
            const result = await db.query(query, values);
            return res.json({ success: true, data: result.rows[0] });
        }
        catch (error) {
            console.error('Error updating user profile:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
    router.delete('/account', async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            await db.query('DELETE FROM users WHERE id = $1', [userId]);
            return res.json({ success: true, message: 'Account deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting user account:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
    return router;
}
//# sourceMappingURL=user.js.map