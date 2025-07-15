import { Pool } from 'pg';
import { AuthorizationMiddleware } from '../middleware/authorization';
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
export declare function setupUserRoutes(db: Pool, authMiddleware?: AuthorizationMiddleware): import("express-serve-static-core").Router;
export default setupUserRoutes;
//# sourceMappingURL=user.d.ts.map