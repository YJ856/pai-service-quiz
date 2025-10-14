import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
  ChildProfileSummary,
} from '../../../application/port/out/profile-directory.port';

/**
 * 외부 User API의 응답 모양(가정)
 * - 실제 응답 스키마가 다르면 이 타입을 바꾸고, 아래 매핑 부분만 수정하면 됨.
 */
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
 * ProfileDirectoryHttpAdapter
 * - 유스케이스에서 의존하는 "ProfileDirectoryPort"의 HTTP 구현체.
 * - 부모/자녀의 "표시용 최소 정보"를 외부 User 서비스에서 가져온다.
 *
 * 환경변수(.env)
 * - USER_SERVICE_BASE_URL: 유저 서비스 베이스 URL (예: https://user.service.internal)
 * - USER_API_PARENT_PATH:   (선택) 부모 단건 경로. 기본 '/api/profiles/parents/:id'
 * - USER_API_CHILD_BATCH_PATH: (선택) 자녀 배치 경로. 기본 '/api/profiles/children/batch'
 */
@Injectable()
export class ProfileDirectoryHttpAdapter implements ProfileDirectoryPort {
  private readonly logger = new Logger(ProfileDirectoryHttpAdapter.name);

  // 베이스 URL (필수)
  private readonly baseUrl = process.env.USER_SERVICE_BASE_URL ?? '';

  // 엔드포인트 경로(옵션)
  private readonly parentPath = process.env.USER_API_PARENT_PATH ?? '/api/profiles/parents/:id';
  private readonly childBatchPath = process.env.USER_API_CHILD_BATCH_PATH ?? '/api/profiles/children/batch';

  constructor(private readonly http: HttpService) {}

  /** 
   * 부모 프로필 단건 조회
   * - 성공: { id, name, avatarMediaId } 로 표준화해 반환
   * - 실패: null (유스케이스에서 안전 폴백)
   */
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

  /** 
   * 자녀 프로필 배치 조회
   * - 성공: { [childId]: { id, name, avatarMediaId } } 형태의 맵으로 반환
   * - 실패: 빈 객체 {} (유스케이스에서 안전 폴백)
   */
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
