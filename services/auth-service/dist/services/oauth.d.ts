import passport from 'passport';
export interface OAuthProfile {
    id: string;
    displayName: string;
    emails: Array<{
        value: string;
        verified?: boolean;
    }>;
    photos?: Array<{
        value: string;
    }>;
    provider: 'google' | 'github';
}
export interface OAuthUser {
    id: string;
    email: string;
    displayName: string;
    avatar?: string;
    provider: 'google' | 'github';
    providerId: string;
}
export declare class OAuthService {
    private static instance;
    private constructor();
    static getInstance(): OAuthService;
    private initializeStrategies;
    private handleGoogleCallback;
    private handleGitHubCallback;
    getPassport(): typeof passport;
    authenticate(provider: 'google' | 'github'): any;
    authenticateCallback(provider: 'google' | 'github'): any;
}
export default OAuthService;
//# sourceMappingURL=oauth.d.ts.map