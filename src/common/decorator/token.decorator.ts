import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * jwt 토큰을 반환한다.
 *
 * @return  {}  [return description]
 */
export const Token = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const response = ctx.switchToHttp().getResponse();
    return response.locals.jwt;
  },
);
