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
  private strategiesInitialized = false;
  private registeredStrategies: Set<string> = new Set();

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
    try {
      console.log('🔧 Initializing OAuth strategies...');
      
      // For testing purposes, use hardcoded dummy credentials
      const googleClientId = process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id-12345';
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret-67890';
      const githubClientId = process.env.GITHUB_CLIENT_ID || 'dummy-github-client-id-12345';
      const githubClientSecret = process.env.GITHUB_CLIENT_SECRET || 'dummy-github-client-secret-67890';
      
      console.log('✅ Using OAuth credentials (dummy for testing)');
      
      // Google OAuth Strategy
      console.log('✅ Initializing Google OAuth strategy...');
      passport.use(new GoogleStrategy({
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/oauth/google/callback',
        scope: ['profile', 'email'],
        passReqToCallback: true
      }, this.handleGoogleCallback.bind(this)));
      this.registeredStrategies.add('google');
      console.log('✅ Google OAuth strategy registered successfully');

      // GitHub OAuth Strategy
      console.log('✅ Initializing GitHub OAuth strategy...');
      passport.use(new GitHubStrategy({
        clientID: githubClientId,
        clientSecret: githubClientSecret,
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/oauth/github/callback',
        scope: ['user:email']
      }, this.handleGitHubCallback.bind(this)));
      this.registeredStrategies.add('github');
      console.log('✅ GitHub OAuth strategy registered successfully');

      this.strategiesInitialized = true;
      console.log('🎉 OAuth strategies initialization complete');
    } catch (error) {
      console.error('❌ Error initializing OAuth strategies:', error);
      throw error;
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
      console.log('🔍 Google OAuth callback received for profile:', profile.id);
      const user: OAuthUser = {
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        displayName: profile.displayName,
        avatar: profile.photos?.[0]?.value,
        provider: 'google',
        providerId: profile.id
      };
      console.log('✅ Google OAuth user processed:', user.email);
      done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth callback error:', error);
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
      console.log('🔍 GitHub OAuth callback received for profile:', profile.id);
      const user: OAuthUser = {
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        displayName: profile.displayName,
        avatar: profile.photos?.[0]?.value,
        provider: 'github',
        providerId: profile.id
      };
      console.log('✅ GitHub OAuth user processed:', user.email);
      done(null, user);
    } catch (error) {
      console.error('❌ GitHub OAuth callback error:', error);
      done(error);
    }
  }

  public getPassport(): typeof passport {
    return passport;
  }

  public authenticate(provider: 'google' | 'github'): any {
    if (!this.strategiesInitialized) {
      console.error(`❌ OAuth strategies not initialized for provider: ${provider}`);
      throw new Error(`OAuth strategies not initialized for provider: ${provider}`);
    }
    
    // Check if strategy exists
    if (!this.registeredStrategies.has(provider)) {
      console.error(`❌ Strategy '${provider}' not found in registered strategies`);
      throw new Error(`Strategy '${provider}' not found in registered strategies`);
    }
    
    console.log(`🔐 Using Passport strategy for provider: ${provider}`);
    return passport.authenticate(provider, { session: false });
  }

  public authenticateCallback(provider: 'google' | 'github'): any {
    if (!this.strategiesInitialized) {
      console.error(`❌ OAuth strategies not initialized for provider: ${provider}`);
      throw new Error(`OAuth strategies not initialized for provider: ${provider}`);
    }
    
    // Check if strategy exists
    if (!this.registeredStrategies.has(provider)) {
      console.error(`❌ Strategy '${provider}' not found in registered strategies`);
      throw new Error(`Strategy '${provider}' not found in registered strategies`);
    }
    
    console.log(`🔐 Using Passport callback strategy for provider: ${provider}`);
    return passport.authenticate(provider, { 
      session: false,
      failureRedirect: '/api/v1/auth/oauth/failure'
    });
  }

  public getStrategiesStatus(): { google: boolean; github: boolean } {
    return {
      google: this.registeredStrategies.has('google'),
      github: this.registeredStrategies.has('github')
    };
  }
}

export default OAuthService; 