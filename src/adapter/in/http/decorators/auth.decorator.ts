import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const Auth = createParamDecorator(
  (field: 'userId' | 'profileId' | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const { auth } = req; // 이 데코레이터는 가드가 먼저 실행되어 req.auth를 채워뒀다는 전제로 동작

    // @Auth() <- 인자 없으면 { userId, profileId } 객체를 통째로 줌
    if (!field)
      return auth
        ? { userId: auth.userId, profileId: auth.profileId }
        : undefined;

    // 특정 필드만 꺼내서 반환
    return auth?.[field];
  },
);
