import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
  ChildProfileSummary,
} from '../../../application/port/out/profile-directory.port';

// ✅ 내부 API 응답 타입(가정) — resp.data 타입 안정화용
type ParentApiResponse = {
  id: number;
  name?: string;
  avatarMediaId?: number | null;
};

type ChildBatchApiResponse = {
  items: Array<{
    id: number;
    name?: string;
    avatarMediaId?: number | null;
  }>;
};

/**
 * 외부 User 서비스 연동 어댑터
 *
 * 환경변수:
 * - USER_SERVICE_BASE_URL (예: https://user.service.internal)
 * - USER_API_PARENT_PATH (optional, 기본: /api/profiles/parents/:id)
 * - USER_API_CHILD_BATCH_PATH (optional, 기본: /api/profiles/children/batch)
 */
@Injectable()
export class ProfileDirectoryHttpAdapter implements ProfileDirectoryPort {
  private readonly logger = new Logger(ProfileDirectoryHttpAdapter.name);
  private readonly baseUrl = process.env.USER_SERVICE_BASE_URL ?? '';
  private readonly parentPath =
    process.env.USER_API_PARENT_PATH ?? '/api/profiles/parents/:id';
  private readonly childBatchPath =
    process.env.USER_API_CHILD_BATCH_PATH ?? '/api/profiles/children/batch';

  constructor(private readonly http: HttpService) {}

  async getParentProfile(parentProfileId: number): Promise<ParentProfileSummary | null> {
    if (!this.baseUrl) {
      this.logger.warn('USER_SERVICE_BASE_URL is not set');
      return null;
    }
    const url = this.join(this.baseUrl, this.parentPath.replace(':id', String(parentProfileId)));

    try {
      const resp = await firstValueFrom(
        this.http.get<ParentApiResponse>(url, { timeout: 3000 }),
      );
      const p = resp?.data;
      if (!p || typeof p.id !== 'number') return null;

      return {
        id: p.id,
        name: String(p.name ?? ''),
        avatarMediaId: p.avatarMediaId ?? null,
      };
    } catch (err) {
      this.logger.warn(`getParentProfile(${parentProfileId}) failed: ${String(err)}`);
      return null;
    }
  }

  async getChildProfiles(childProfileIds: number[]): Promise<Record<number, ChildProfileSummary>> {
    const result: Record<number, ChildProfileSummary> = {};
    if (!this.baseUrl || childProfileIds.length === 0) return result;

    const url = this.join(this.baseUrl, this.childBatchPath);

    try {
      const resp = await firstValueFrom(
        this.http.post<ChildBatchApiResponse>(url, { ids: childProfileIds }, { timeout: 3000 }),
      );

      const items = resp?.data?.items ?? [];
      for (const it of items) {
        if (typeof it?.id === 'number') {
          result[it.id] = {
            id: it.id,
            name: String(it.name ?? ''),
            avatarMediaId: it.avatarMediaId ?? null,
          };
        }
      }
      return result;
    } catch (err) {
      this.logger.warn(`getChildProfiles(${childProfileIds.length}) failed: ${String(err)}`);
      return result;
    }
  }

  // ---- utils ----
  private join(base: string, path: string): string {
    if (!base.endsWith('/') && !path.startsWith('/')) return `${base}/${path}`;
    if (base.endsWith('/') && path.startsWith('/')) return `${base}${path.slice(1)}`;
    return `${base}${path}`;
  }
}
