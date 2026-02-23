import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, StrategyOptions } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../modules/auth/auth.service.js'; // ✅ Add this

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private config: ConfigService,
    private authService: AuthService, // ✅ Inject AuthService
  ) {
    const options: StrategyOptions = {
      clientID: config.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
      
    };
    console.log('GOOGLE STRATEGY INIT', options.clientID);
    console.log('GOOGLE STRATEGY INIT', options.callbackURL);
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);
    console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);
    super(options);
  }

    authorizationParams(): Record<string, string> {
    return {
      prompt: 'select_account',
    };
  }

 async validate(
  accessToken: string,
  refreshToken: string,
  profile: Profile,
) {
  const email = profile.emails?.[0]?.value;

  if (!email) {
    throw new Error('Google account has no email');
  }

  return {
    email,
    username: email.split('@')[0],
  };
}

}
console.log('🔥 GoogleStrategy initialized');
