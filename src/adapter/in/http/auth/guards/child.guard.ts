import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { verifyAccessToken } from '../token.verifier';

@Injectable()
export class ChildGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest() as any;

    // 1) Bearer 토큰 추출
    const authHeader = req.headers['authorization'] as string | undefined;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('UNAUTHORIZED: Bearer token required');
    }
    const token = authHeader.slice('Bearer '.length).trim();

    // 2) 서명/만료 검증 + 클레임 추출
    let claims: any;
    try {
      claims = await verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('UNAUTHORIZED: invalid or expired token');
    }

    // 3) 필요한 클레임 확인
    const userId = claims.sub;
    const profileId = claims.profileId;
    const profileType = String(claims.profileType || '').toLowerCase();

    if (!userId) throw new UnauthorizedException('UNAUTHORIZED: sub(userId) missing');
    if (!profileId) throw new BadRequestException('VALIDATION_ERROR: profileId missing');
    if (profileType !== 'child') throw new ForbiddenException('FORBIDDEN: child profile required');

    // 4) 쓰기 쉽게 저장
    req.auth = {
      token,
      userId,
      profileId,
      role: 'child' as const,
      claims,
    };

    return true;
  }
}
