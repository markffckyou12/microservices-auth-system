import { Router } from 'express';
import { PasswordService } from '../services/password';
interface AuthenticatedUser {
    id: string;
    email: string;
    roles?: string[];
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}
export default function createPasswordRouter(passwordService: PasswordService): Router;
export {};
//# sourceMappingURL=password.d.ts.map