import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

export class LocalAuthGuard extends AuthGuard('yeop-local') {}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'yeop-local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  /**
   * LocalStrategy
   *
   * validate : username, password
   *
   * return -> Request();
   */
  async validate(email: string, password: string) {
    const user = await this.authService.authenticate(email, password);

    return user;
  }
}
