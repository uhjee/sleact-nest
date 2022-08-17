import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 로그인 가드
 */

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const can = await super.canActivate(context);
    if (can) {
      // context에서 request 정보 추출
      const request = context.switchToHttp().getRequest();
      console.log('-> request', request);
      // local strategy 갔다가 로그인 되면 serializeUser로 감
      await super.logIn(request);
    }

    return true;
  }
}
