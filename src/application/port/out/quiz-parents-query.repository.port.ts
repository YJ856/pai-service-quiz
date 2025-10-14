import type { ParentsTodayItemDto, 
              ParentsCompletedItemDto,
              ParentsScheduledItemDto,
             } from 'pai-shared-types';

// 오늘의 퀴즈
export interface FindParentsTodayParams {
  parentProfileId: string; // 가드에서 주입된 부모 프로필 ID
  todayYmd: string; // Asia/Seoul 기준 yyyy-MM-dd
  limit: number; // 페이지 크기 (1~50)
  afterQuizId?: number; // 커서 이후의 quizId (strictly greater than) - 없으면 첫 페이지
}

export interface FindParentsTodayResult {
  items: ParentsTodayItemDto[]; // 목록(컨트롤러 응답 스키마와 동일한 필드 세트)
  hasNext: boolean; // 다음 페이지가 있는지 여부
}

// 완료된 퀴즈
export interface FindParentsCompletedParams {
  parentProfileId: string;
  limit: number; // 1..50
  /**
   * 커서 기준(없으면 첫 페이지)
   * - publishDateYmd: 'yyyy-MM-dd'
   * - quizId: number
   */
  after?: {
    publishDateYmd: string;
    quizId: number;
  };
}

export interface FindParentsCompletedResult {
  items: ParentsCompletedItemDto[];
  hasNext: boolean;
}

// 예정된 퀴즈
export interface FindParentsScheduledParams {
  parentProfileId: string;
  limit: number; // 1..50
  after?: {
    publishDateYmd: string; // yyyy-MM-dd
    quizId: number;
  };
}
export interface FindParentsScheduledResult {
  items: ParentsScheduledItemDto[];
  hasNext: boolean;
}


// 레포지토리 포트
export interface QuizParentsQueryRepositoryPort {
  // 오늘의 퀴즈
  findParentsToday(params: FindParentsTodayParams): Promise<FindParentsTodayResult>;

  // 완료된 퀴즈
  findParentsCompleted(params: FindParentsCompletedParams,): Promise<FindParentsCompletedResult>;

  // 예정된 퀴즈
  findParentsScheduled(params: FindParentsScheduledParams,): Promise<FindParentsScheduledResult>;
}
