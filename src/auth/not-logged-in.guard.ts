import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * 로그인이 필요 없는 미들웨어
 * guard는 CanActivate를 구현해야 한다.
 */

@Injectable()
export class NotLoggedInGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // express의 request
    const request = context.switchToHttp().getRequest();
    // return값에 따라 다음 흐름을 탈지 안탈지 결정
    return !request.isAuthenticated();
  }
}
