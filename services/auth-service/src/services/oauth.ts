import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Request } from 'express';

export interface OAuthProfile {
  id: string;
  displayName: string;
  emails: Array<{ value: string; verified?: boolean }>;
  photos?: Array<{ value: string }>;
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

export class OAuthService {
  private static instance: OAuthService;

  private constructor() {
    this.initializeStrategies();
  }

  public static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  private initializeStrategies(): void {
    // Google OAuth Strategy - only initialize if credentials are provided
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
        scope: ['profile', 'email'],
        passReqToCallback: true
      }, this.handleGoogleCallback.bind(this)));
    }

    // GitHub OAuth Strategy - only initialize if credentials are provided
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/github/callback',
        scope: ['user:email']
      }, this.handleGitHubCallback.bind(this)));
    }
  }

  // Update Google callback signature to match StrategyOptionsWithRequest
  private async handleGoogleCallback(
    req: Request,
    accessToken: string,
    refreshToken: string,
    params: any,
    profile: any,
    done: (error: any, user?: any) => void
  ): Promise<void> {
    try {
      const user: OAuthUser = {
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        displayName: profile.displayName,
        avatar: profile.photos?.[0]?.value,
        provider: 'google',
        providerId: profile.id
      };
      done(null, user);
    } catch (error) {
      done(error);
    }
  }

  private async handleGitHubCallback(
    accessToken: string,
    refreshToken: string,
    profile: OAuthProfile,
    done: (error: any, user?: any) => void
  ): Promise<void> {
    try {
      const user: OAuthUser = {
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        displayName: profile.displayName,
        avatar: profile.photos?.[0]?.value,
        provider: 'github',
        providerId: profile.id
      };
      done(null, user);
    } catch (error) {
      done(error);
    }
  }

  public getPassport(): typeof passport {
    return passport;
  }

  public authenticate(provider: 'google' | 'github'): any {
    return passport.authenticate(provider, { session: false });
  }

  public authenticateCallback(provider: 'google' | 'github'): any {
    return passport.authenticate(provider, { 
      session: false,
      failureRedirect: '/auth/failure'
    });
  }
}

export default OAuthService; 