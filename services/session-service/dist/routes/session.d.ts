import { RedisClientType } from 'redis';
interface AuthenticatedUser {
    id: string;
    sessionId?: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}
export default function createSessionRoutes(redis: RedisClientType): import("express-serve-static-core").Router;
export {};
//# sourceMappingURL=session.d.ts.map