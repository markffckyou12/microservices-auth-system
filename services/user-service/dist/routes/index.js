"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const express_1 = require("express");
const user_1 = __importDefault(require("./user"));
const rbac_1 = require("./rbac");
const audit_1 = require("./audit");
const password_1 = __importDefault(require("./password"));
const rbac_2 = require("../services/rbac");
const audit_2 = require("../services/audit");
const password_2 = require("../services/password");
function setupRoutes(db) {
    const router = (0, express_1.Router)();
    const rbacService = new rbac_2.RBACService(db);
    const auditService = new audit_2.AuditServiceImpl(db);
    const passwordService = new password_2.PasswordServiceImpl(db);
    const userRouter = (0, user_1.default)(db);
    router.use('/users', userRouter);
    router.use('/rbac', (0, rbac_1.createRBACRouter)(rbacService));
    router.use('/audit', (0, audit_1.createAuditRouter)(auditService));
    router.use('/password', (0, password_1.default)(passwordService));
    return router;
}
//# sourceMappingURL=index.js.map