import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { TokenVersionQueryPort } from 'src/application/port/out/token-version.query.port';
import { REDIS_CLIENT } from './redis.module';

@Injectable()
export class RedisTokenVersionQueryAdapter implements TokenVersionQueryPort {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private getKey(userId: number): string {
    return `user:${userId}:token_version`;
  }

  async getVersion(userId: number): Promise<number> {
    const key = this.getKey(userId);
    const version = await this.redis.get(key);
    // 없으면 0 반환
    return version ? parseInt(version, 10) : 0;
  }
}
