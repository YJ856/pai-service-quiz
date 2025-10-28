// 내부용 Result DTO (bigint 타입 사용)
import type { ParentsTodayItemDto } from '../in/result/parents-today-quiz-result.dto';
import type { ParentsCompletedItemDto } from '../in/result/parents-completed-quiz-result.dto';
import type { ParentsScheduledItemDto } from '../in/result/parents-scheduled-quiz-result.dto';
import type { ChildrenTodayItemDto } from '../in/result/children-today-quiz-result.dto';
import type { ChildrenCompletedItemDto } from '../in/result/children-completed-quiz-result.dto';

// ============================================================
// 기본 유틸리티 조회
// ============================================================

// ============================================================
// 부모용 목록 조회
// ============================================================

// 오늘의 퀴즈
export interface FindParentsTodayParams {
  parentProfileId: bigint;
  todayYmd: string;
  limit: number;
  afterQuizId?: bigint;
}

export interface FindParentsTodayResult {
  items: ParentsTodayItemDto[];
  hasNext: boolean;
}

// 완료된 퀴즈
export interface FindParentsCompletedParams {
  parentProfileId: bigint;
  limit: number;
  after?: {
    publishDateYmd: string;
    quizId: bigint;
  };
}

export interface FindParentsCompletedResult {
  items: ParentsCompletedItemDto[];
  hasNext: boolean;
}

// 예정된 퀴즈
export interface FindParentsScheduledParams {
  parentProfileId: bigint;
  limit: number;
  after?: {
    publishDateYmd: string;
    quizId: bigint;
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
  childProfileId: bigint;
  todayYmd: string;
  limit: number;
  afterQuizId?: bigint;
}

export interface FindChildrenTodayResult {
  items: ChildrenTodayItemDto[];
  hasNext: boolean;
}

// 완료된 퀴즈(자녀용)
export interface FindChildrenCompletedParams {
  childProfileId: bigint;
  limit: number;
  after?: {
    publishDateYmd: string;
    quizId: bigint;
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
  id: bigint;
  question: string;
  answer: string;
  hint: string | null;
  reward: string | null;
  publishDate: Date;
  parentProfileId: bigint;
  // status는 제거 - publishDate 기반으로 계산
};

// ============================================================
// 정답 제출 대상 조회
// ============================================================

export interface FindAnswerTargetParams {
  childProfileId: bigint;
  quizId: bigint;
  todayYmd: string;
}

export interface AnswerTargetRow {
  quizId: bigint;
  publishDateYmd: string;
  answer: string;
  reward?: string | null;
  isSolved: boolean;
  authorParentProfileId: bigint;
  authorParentName?: string | null;
  authorParentAvatarMediaId?: bigint | null;
  // status는 제거 - publishDate 기반으로 계산
}

// ============================================================
// 통합 읽기 포트
// ============================================================

export interface QuizQueryPort {
  // 기본 유틸리티
  findLastScheduledDateYmd(parentProfileId: bigint): Promise<string | null>;
  existsAnyOnDate(parentProfileId: bigint, ymd: string): Promise<boolean>;

  // 부모용 목록 조회
  findParentsToday(params: FindParentsTodayParams): Promise<FindParentsTodayResult>;
  findParentsCompleted(params: FindParentsCompletedParams): Promise<FindParentsCompletedResult>;
  findParentsScheduled(params: FindParentsScheduledParams): Promise<FindParentsScheduledResult>;

  // 자녀용 목록 조회
  findChildrenToday(params: FindChildrenTodayParams): Promise<FindChildrenTodayResult>;
  findChildrenCompleted(params: FindChildrenCompletedParams): Promise<FindChildrenCompletedResult>;

  // 상세 조회
  findDetailById(quizId: bigint): Promise<QuizDetailRow | null>;

  // 정답 제출 대상 조회
  findAnswerTarget(params: FindAnswerTargetParams): Promise<AnswerTargetRow | null>;
}
