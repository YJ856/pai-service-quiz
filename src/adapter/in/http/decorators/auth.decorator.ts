import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Auth = createParamDecorator(
    (field: 'userId' | 'profileId' | undefined, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest() as any;
        const { auth } = req;
        if (!field) return auth ? { userId: auth.userId, profileId: auth.profileId } : undefined;
        return auth?.[field];
    },
);