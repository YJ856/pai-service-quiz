import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { firstValueFrom } from 'rxjs';
import type { Request } from 'express';
import type {
  ProfileDirectoryPort,
  FamilyProfileSummary,
  ParentProfileSummary,
  ChildProfileSummary,
} from '../../../application/port/out/profile-directory.port';
import { ProfileDto } from 'pai-shared-types';

type UserApiResponse = {
  success: boolean;
  message: string;
  data: {
    profiles: ProfileDto[];
  };
};


@Injectable({ scope: Scope.REQUEST })
export class ProfileDirectoryHttpAdapter implements ProfileDirectoryPort {
  private readonly logger = new Logger(ProfileDirectoryHttpAdapter.name);

  // 베이스 URL (필수)
  private readonly baseUrl = process.env.USER_SERVICE_BASE_URL ?? '';

  // 엔드포인트 경로(옵션)
  private readonly profilePath = process.env.USER_API_PROFILE_PATH ?? '/api/profiles';

  constructor(
    private readonly http: HttpService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  async getFamilyProfileWithScopeAll(): Promise<FamilyProfileSummary> {
    if (!this.baseUrl) {
      this.logger.warn('USER_SERVICE_BASE_URL is not set');
      return { parents: [], children: [] };
    }

    const url = this.joinUrl(this.baseUrl, this.profilePath);
    const authorization = normalizeBearer(this.request.headers.authorization);

    try {
      const { data } = await firstValueFrom(
        this.http.get<UserApiResponse>(url, {
          headers: authorization ? { Authorization: authorization } : undefined,
          params: { profileType: 'all' },
          timeout: 3000,
        }),
      );

      const profiles = data?.data?.profiles ?? [];
      const parents: ParentProfileSummary[] = [];
      const children: ChildProfileSummary[] = [];

      for (const profile of profiles) {
        const summary = {
          profileId: Number(profile.profileId),
          name: String(profile.name ?? ''),
          avatarMediaId: parseBigIntOrNull(profile.avatarMediaId),
        };

        if (profile.profileType === 'parent') parents.push(summary);
        else if (profile.profileType === 'child') children.push(summary);
      }

      return { parents, children };
    } catch (error) {
      this.logger.warn(`getFamilyProfileWithScopeAll failed: ${String(error)}`);
      return { parents: [], children: [] };
    }
  }

  async getFamilyProfileWithScopeParents(): Promise<{ parents: ParentProfileSummary[] }> {
    if (!this.baseUrl) { 
      this.logger.warn('USER_SERVICE_BASE_URL is not set'); 
      return { parents: [] }; 
    }

    const url = this.joinUrl(this.baseUrl, this.profilePath);
    const authorization = normalizeBearer(this.request.headers.authorization);

    try {
      const { data } = await firstValueFrom(
        this.http.get<UserApiResponse>(url, {
          headers: authorization ? { Authorization: authorization } : undefined,
          params: { profileType: 'parent' },
          timeout: 3000,
        }),
      );

      const profiles = data?.data?.profiles ?? [];
      const parents: ParentProfileSummary[] = profiles.map((profile) => ({
        profileId: Number(profile.profileId),
        name: String(profile.name ?? ''),
        avatarMediaId: parseBigIntOrNull(profile.avatarMediaId),
      }));
      return { parents };
    } catch (error) {
      this.logger.warn(`getFamilyProfileWithScopeParents failed: ${String(error)}`);
      return { parents: [] };
    }
  }

  // ---- utils ----
  private joinUrl(base: string, path: string): string {
    if (!base.endsWith('/') && !path.startsWith('/')) return `${base}/${path}`;
    if (base.endsWith('/') && path.startsWith('/')) return `${base}${path.slice(1)}`;
    return `${base}${path}`;
  }
}

function parseBigIntOrNull(input: unknown): bigint | null {
  if (input === null || input === undefined) return null;
  const stringTrimmed = String(input).trim();
  if (!stringTrimmed) return null;
  try { return BigInt(stringTrimmed); } catch { return null }
}

function normalizeBearer(authorizationHeader?: string): string | undefined {
  if (!authorizationHeader) return undefined;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token ? `Bearer ${token}` : undefined;
}
