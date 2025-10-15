import type { ChildrenTodayItemDto, ChildrenCompletedItemDto, } from 'pai-shared-types';

// 오늘의 퀴즈(자녀용)
export interface FindChildrenTodayParams {
  childProfileId: string; // 가드에서 주입된 자녀 프로필 ID
  todayYmd: string;       // Asia/Seoul 기준 'yyyy-MM-dd'
  limit: number;          // 페이지 크기 (1..50)
  afterQuizId?: number;   // 커서 이후의 quizId (strictly greater than); 없으면 첫 페이지
}

export interface FindChildrenTodayResult {
  items: ChildrenTodayItemDto[]; // 컨트롤러 응답 스키마와 동일 필드 세트
  hasNext: boolean;              // 다음 페이지 존재 여부
}

// 완료된 퀴즈(자녀용)
export interface FindChildrenCompletedParams {
  childProfileId: string;
  limit: number; // 1..50
  after?: {
    publishDateYmd: string; // 'yyyy-MM-dd' (KST 기준)
    quizId: number;
  }; // 없으면 첫 페이지
}

export interface FindChildrenCompletedResult {
  items: ChildrenCompletedItemDto[]; // 질문/정답/보상/출제자/출제일
  hasNext: boolean;
}

// 레포지토리 포트(자녀용)
export interface QuizChildrenQueryRepositoryPort {
  // 오늘의 퀴즈
  findChildrenToday(params: FindChildrenTodayParams): Promise<FindChildrenTodayResult>;

  // 완료된 퀴즈 (본인이 푼 것만)
  findChildrenCompleted(params: FindChildrenCompletedParams): Promise<FindChildrenCompletedResult>;
}
