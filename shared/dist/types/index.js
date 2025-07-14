"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthEventType = exports.MFAType = exports.OAuthProvider = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
    UserRole["MODERATOR"] = "moderator";
    UserRole["GUEST"] = "guest";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
    UserStatus["PENDING"] = "pending";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var OAuthProvider;
(function (OAuthProvider) {
    OAuthProvider["GOOGLE"] = "google";
    OAuthProvider["GITHUB"] = "github";
    OAuthProvider["FACEBOOK"] = "facebook";
    OAuthProvider["LINKEDIN"] = "linkedin";
})(OAuthProvider || (exports.OAuthProvider = OAuthProvider = {}));
var MFAType;
(function (MFAType) {
    MFAType["TOTP"] = "totp";
    MFAType["SMS"] = "sms";
    MFAType["EMAIL"] = "email";
    MFAType["BACKUP"] = "backup";
})(MFAType || (exports.MFAType = MFAType = {}));
var AuthEventType;
(function (AuthEventType) {
    AuthEventType["LOGIN"] = "login";
    AuthEventType["LOGOUT"] = "logout";
    AuthEventType["REGISTER"] = "register";
    AuthEventType["PASSWORD_CHANGE"] = "password_change";
    AuthEventType["PASSWORD_RESET"] = "password_reset";
    AuthEventType["EMAIL_VERIFICATION"] = "email_verification";
    AuthEventType["MFA_ENABLE"] = "mfa_enable";
    AuthEventType["MFA_DISABLE"] = "mfa_disable";
    AuthEventType["OAUTH_LOGIN"] = "oauth_login";
    AuthEventType["ACCOUNT_LOCK"] = "account_lock";
    AuthEventType["ACCOUNT_UNLOCK"] = "account_unlock";
})(AuthEventType || (exports.AuthEventType = AuthEventType = {}));
//# sourceMappingURL=index.js.map