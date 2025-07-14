import { Pool } from 'pg';
interface AuthenticatedUser {
    id: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}
export default function createUserRoutes(db: Pool): import("express-serve-static-core").Router;
export {};
//# sourceMappingURL=user.d.ts.map