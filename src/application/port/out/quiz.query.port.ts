import type {
  ParentsTodayItemDto,
  ParentsCompletedItemDto,
  ParentsScheduledItemDto,
  ChildrenTodayItemDto,
  ChildrenCompletedItemDto,
} from 'pai-shared-types';

// ============================================================
// 기본 유틸리티 조회
// ============================================================

// ============================================================
// 부모용 목록 조회
// ============================================================

// 오늘의 퀴즈
export interface FindParentsTodayParams {
  parentProfileId: number;
  todayYmd: string;
  limit: number;
  afterQuizId?: number;
}

export interface FindParentsTodayResult {
  items: ParentsTodayItemDto[];
  hasNext: boolean;
}

// 완료된 퀴즈
export interface FindParentsCompletedParams {
  parentProfileId: number;
  limit: number;
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
  parentProfileId: number;
  limit: number;
  after?: {
    publishDateYmd: string;
    quizId: number;
  };
}

export interface FindParentsScheduledResult {
  items: ParentsScheduledItemDto[];
  hasNext: boolean;
}

// ============================================================
// 자녀용 목록 조회
// ============================================================

// 오늘의 퀴즈(자녀용)
export interface FindChildrenTodayParams {
  childProfileId: number;
  todayYmd: string;
  limit: number;
  afterQuizId?: number;
}

export interface FindChildrenTodayResult {
  items: ChildrenTodayItemDto[];
  hasNext: boolean;
}

// 완료된 퀴즈(자녀용)
export interface FindChildrenCompletedParams {
  childProfileId: number;
  limit: number;
  after?: {
    publishDateYmd: string;
    quizId: number;
  };
}

export interface FindChildrenCompletedResult {
  items: ChildrenCompletedItemDto[];
  hasNext: boolean;
}

// ============================================================
// 상세 조회
// ============================================================

export type QuizDetailRow = {
  id: number;
  question: string;
  answer: string;
  hint: string | null;
  reward: string | null;
  publishDate: Date;
  parentProfileId: number;
  // status는 제거 - publishDate 기반으로 계산
};

// ============================================================
// 정답 제출 대상 조회
// ============================================================

export interface FindAnswerTargetParams {
  childProfileId: number;
  quizId: number;
  todayYmd: string;
}

export interface AnswerTargetRow {
  quizId: number;
  publishDateYmd: string;
  answer: string;
  reward?: string | null;
  isSolved: boolean;
  authorParentProfileId: number;
  authorParentName?: string | null;
  authorParentAvatarMediaId?: number | null;
  // status는 제거 - publishDate 기반으로 계산
}

// ============================================================
// 통합 읽기 포트
// ============================================================

export interface QuizQueryPort {
  // 기본 유틸리티
  findLastScheduledDateYmd(parentProfileId: number): Promise<string | null>;
  existsAnyOnDate(parentProfileId: number, ymd: string): Promise<boolean>;

  // 부모용 목록 조회
  findParentsToday(params: FindParentsTodayParams): Promise<FindParentsTodayResult>;
  findParentsCompleted(params: FindParentsCompletedParams): Promise<FindParentsCompletedResult>;
  findParentsScheduled(params: FindParentsScheduledParams): Promise<FindParentsScheduledResult>;

  // 자녀용 목록 조회
  findChildrenToday(params: FindChildrenTodayParams): Promise<FindChildrenTodayResult>;
  findChildrenCompleted(params: FindChildrenCompletedParams): Promise<FindChildrenCompletedResult>;

  // 상세 조회
  findDetailById(quizId: number): Promise<QuizDetailRow | null>;

  // 정답 제출 대상 조회
  findAnswerTarget(params: FindAnswerTargetParams): Promise<AnswerTargetRow | null>;
}
