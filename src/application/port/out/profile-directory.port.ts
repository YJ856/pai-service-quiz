/**
 * 외부 User 서비스(또는 Profile Directory)에서
 * 부모/자녀 프로필의 "표시용 최소 정보"를 조회하기 위한 포트.
 * - Infra 레이어에서 HTTP 클라이언트 어댑터로 구현한다.
 */

export interface ParentProfileSummary {
  id: number;
  name: string;
  avatarMediaId: number | null;
}

export interface ChildProfileSummary {
  id: number;
  name: string;
  avatarMediaId: number | null;
}

export interface ProfileDirectoryPort {
  /**
   * 부모 프로필 단건 조회
   * - 없으면 null
   */
  getParentProfile(parentProfileId: number): Promise<ParentProfileSummary | null>;

  /**
   * 자녀 프로필 다건 조회 (배치)
   * - 입력 ids에 대한 결과만 반환(없는 id는 누락 가능)
   * - 성능을 위해 Map/Record 형태로 반환
   */
  getChildProfiles(childProfileIds: number[]): Promise<Record<number, ChildProfileSummary>>;
}
