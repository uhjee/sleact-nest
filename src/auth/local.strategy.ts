import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string, done: CallableFunction) {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException(); // 401 exception
    }
    return done(null, user);
  }
}
