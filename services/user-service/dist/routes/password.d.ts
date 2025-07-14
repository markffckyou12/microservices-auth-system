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
export default function createPasswordRoutes(db: Pool): import("express-serve-static-core").Router;
export {};
//# sourceMappingURL=password.d.ts.map