import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

export type AuthClaims = JWTPayload & {
  sub: string; // userId (가족 계정)
  profileId?: string | number; // 프로필 ID (부모/자녀)
  profileType?: 'parent' | 'child';
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

/** 비대칭키(JWKS) 검증 */
async function verifyWithJwks(token: string): Promise<AuthClaims> {
  if (!process.env.AUTH_JWKS_URL) throw new Error('AUTH_JWKS_URL is not set');
  if (!jwks) jwks = createRemoteJWKSet(new URL(process.env.AUTH_JWKS_URL));
  const { payload } = await jwtVerify(token, jwks, { clockTolerance: '5s' });
  return payload as AuthClaims;
}

/** 대칭키(HMAC) 검증 */
async function verifyWithHmac(token: string): Promise<AuthClaims> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET is not set');
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, { clockTolerance: '5s' });
  return payload as AuthClaims;
}

/**
 * 공용 진입점: 환경변수에 따라 JWKS 또는 HMAC 방식으로 검증
 */
export async function verifyAccessToken(token: string): Promise<AuthClaims> {
  if (process.env.AUTH_JWKS_URL) {
    return verifyWithJwks(token);
  }
  return verifyWithHmac(token);
}
