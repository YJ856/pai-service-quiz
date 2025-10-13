import type { ParentsTodayItemDto } from 'pai-shared-types';

/**
 * 부모용 "오늘의 퀴즈" 조회용 레포지토리 포트
 * - Infra(Prisma 등)에서 이 인터페이스를 구현한다.
 */
export interface FindParentsTodayParams {
  /** 가드에서 주입된 부모 프로필 ID */
  parentProfileId: string;
  /** Asia/Seoul 기준 yyyy-MM-dd */
  todayYmd: string;
  /** 페이지 크기 (1~50) */
  limit: number;
  /**
   * 커서 이후의 quizId (strictly greater than)
   * - 없으면 첫 페이지
   */
  afterQuizId?: number;
}

export interface FindParentsTodayResult {
  /** 목록(컨트롤러 응답 스키마와 동일한 필드 세트) */
  items: ParentsTodayItemDto[];
  /** 다음 페이지가 있는지 여부 */
  hasNext: boolean;
}

export interface QuizParentsQueryRepositoryPort {
  /**
   * 오늘의 퀴즈(부모용) 목록 조회
   * - 정렬: quizId 오름차순 (커서 페이징에 유리)
   * - 페이징: `afterQuizId` 초과 조건 + limit
   */
  findParentsToday(params: FindParentsTodayParams): Promise<FindParentsTodayResult>;
}
