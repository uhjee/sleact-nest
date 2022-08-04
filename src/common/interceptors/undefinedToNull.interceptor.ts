import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

/**
 * 핸들러의 반환값이 undfined인 경우 Null로 변경
 * 주로 핸들러 이후, 마지막으로 데이터를 한 번 더 가공하는 역할
 * 공통으로 처리해주어야 하는 부분을 담당
 */
@Injectable()
export class UndefinedToNullInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    // 핸들러 전 부분

    // data: handler 반환값
    return next
      .handle()
      .pipe(map((data) => (data === undefined ? null : data)));
    // 핸들러 후 부분
  }
}
