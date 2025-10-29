import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
  ChildProfileSummary,
} from '../../../application/port/out/profile-directory.port';

/**
 * 외부 User API의 응답 모양 (pai-shared-types 기반)
 * - BaseResponse<GetProfilesResponseData> 형태
 */
type ProfileDto = {
  profileId: number;
  profileType: 'PARENT' | 'CHILD';
  name: string;
  birthDate: string;
  gender: string;
  avatarMediaId?: string;
  voiceMediaId?: number;
  createdAt: string;
};

type UserApiResponse = {
  success: boolean;
  message: string;
  data: {
    profiles: ProfileDto[];
  };
};

/**
 * ProfileDirectoryHttpAdapter
 * - 유스케이스에서 의존하는 "ProfileDirectoryPort"의 HTTP 구현체.
 * - 부모/자녀의 "표시용 최소 정보"를 외부 User 서비스에서 가져온다.
 *
 * 환경변수(.env)
 * - USER_SERVICE_BASE_URL: 유저 서비스 베이스 URL (예: http://localhost:3001)
 * - USER_API_PARENT_PATH:   (선택) 부모 프로필 경로. 기본 '/api/profiles/parent'
 * - USER_API_CHILD_PATH: (선택) 자녀 프로필 경로. 기본 '/api/profiles/child'
 */
@Injectable()
export class ProfileDirectoryHttpAdapter implements ProfileDirectoryPort {
  private readonly logger = new Logger(ProfileDirectoryHttpAdapter.name);

  // 베이스 URL (필수)
  private readonly baseUrl = process.env.USER_SERVICE_BASE_URL ?? '';

  // 엔드포인트 경로(옵션)
  private readonly parentPath = process.env.USER_API_PARENT_PATH ?? '/api/profiles/parent';
  private readonly childPath = process.env.USER_API_CHILD_PATH ?? '/api/profiles/child';

  constructor(private readonly http: HttpService) {}

  /**
   * 부모 프로필 단건 조회
   * - GET /api/profiles/parent (Body에 profileType: 'PARENT' 전달)
   * - 성공: { id: number, name, avatarMediaId: bigint } 로 표준화해 반환
   * - 실패: null (유스케이스에서 안전 폴백)
   */
  async getParentProfile(parentProfileId: number): Promise<ParentProfileSummary | null> {
    if (!this.baseUrl) {
      this.logger.warn('USER_SERVICE_BASE_URL is not set');
      return null;
    }
    const url = this.join(this.baseUrl, this.parentPath);

    try {
      // GET 요청이지만 Body를 전달 (user-service API 스펙에 맞춤)
      const resp = await firstValueFrom(
        this.http.get<UserApiResponse>(url, {
          data: { profileType: 'PARENT' },
          timeout: 3000,
        }),
      );

      const profiles = resp?.data?.data?.profiles ?? [];
      const profile = profiles.find(p => p.profileId === parentProfileId);

      if (!profile) return null;

      return {
        id: profile.profileId,
        name: profile.name,
        avatarMediaId: profile.avatarMediaId ? BigInt(profile.avatarMediaId) : null,
      };
    } catch (err) {
      this.logger.warn(`getParentProfile(${parentProfileId}) failed: ${String(err)}`);
      return null;
    }
  }

  /**
   * 자녀 프로필 배치 조회
   * - GET /api/profiles/child (Body에 profileType: 'CHILD' 전달)
   * - 성공: { [childId]: { id: number, name, avatarMediaId: bigint } } 형태의 맵으로 반환
   * - 실패: 빈 객체 {} (유스케이스에서 안전 폴백)
   */
  async getChildProfiles(childProfileIds: number[]): Promise<Record<string, ChildProfileSummary>> {
    const result: Record<string, ChildProfileSummary> = {};
    if (!this.baseUrl || childProfileIds.length === 0) return result;

    const url = this.join(this.baseUrl, this.childPath);

    try {
      // GET 요청이지만 Body를 전달 (user-service API 스펙에 맞춤)
      const resp = await firstValueFrom(
        this.http.get<UserApiResponse>(url, {
          data: { profileType: 'CHILD' },
          timeout: 3000,
        }),
      );

      const profiles = resp?.data?.data?.profiles ?? [];

      // childProfileIds에 해당하는 프로필만 필터링하여 맵으로 변환
      const idSet = new Set(childProfileIds);
      for (const profile of profiles) {
        if (idSet.has(profile.profileId)) {
          result[profile.profileId.toString()] = {
            id: profile.profileId,
            name: profile.name,
            avatarMediaId: profile.avatarMediaId ? BigInt(profile.avatarMediaId) : null,
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
