// 내부용 Result DTO (bigint 타입 사용)
import type { ParentsTodayItemDto } from '../in/result/parents-today-quiz-result.dto';
import type { ParentsCompletedItemDto } from '../in/result/parents-completed-quiz-result.dto';
import type { ParentsScheduledItemDto } from '../in/result/parents-scheduled-quiz-result.dto';
import type { ChildrenTodayItemDto } from '../in/result/children-today-quiz-result.dto';
import type { ChildrenCompletedItemDto } from '../in/result/children-completed-quiz-result.dto';


// 공통 타입 ===============================================
export interface PageResult<T> {
  items: T[];
  hasNext: boolean;
}

// 커서 유형(두 가지)
export interface CursorById {
  afterQuizId?: bigint;
}
export interface CursorByDateId {
  paginationCursor?: { publishDateYmd: string; quizId: bigint };
}


// 부모용 조회 ===============================================

// 오늘의 퀴즈(부모용)
export interface FindParentsTodayParams extends CursorById {
  parentProfileId: number;
  todayYmd: string;
  limit: number;
}
export type FindParentsTodayResult = PageResult<ParentsTodayItemDto>

// 완료된 퀴즈 조회 요청(부모용) 이건 쓸모 없는 거 같기도...?
export interface FindParentsCompletedParams extends CursorByDateId {
  parentProfileId: number; 
  limit: number;
}
export type FindParentsCompletedResult = PageResult<ParentsCompletedItemDto>



// 완료된 퀴즈 전체 조회
export interface FindFamilyParentsCompletedParams extends CursorByDateId { // 탐색 의뢰서
  parentProfileIds: number[];
  beforeDateYmd: string; // 탐색 기준(상한선: 이 날짜보다 이전 날짜)
  limit: number;
}
export type FamilyParentsCompletedRow = { // 발견한 기록 한 줄
  quizId: bigint;
  publishDateYmd: string;
  question: string;
  answer: string;
  reward: string | null;
  authorParentProfileId: number;
}
export type FindFamilyParentsCompletedResult = PageResult<FamilyParentsCompletedRow>; // 탐색 보고서(페이지네이션 포함)



// 예정된 퀴즈(부모용)
export interface FindParentsScheduledParams extends CursorByDateId {
  parentProfileId: number;
  limit: number;
}
export type FindParentsScheduledResult = PageResult<ParentsScheduledItemDto>

// 상세 조회
export type QuizDetailRow = {
  id: bigint;
  question: string;
  answer: string;
  hint: string | null;
  reward: string | null;
  publishDate: Date;
  parentProfileId: number;
};


// 자녀용 조회 ===============================================

// 오늘의 퀴즈(자녀용)
export interface FindChildrenTodayParams extends CursorById {
  childProfileId: number;
  todayYmd: string;
  limit: number;
}
export type FindChildrenTodayResult = PageResult<ChildrenTodayItemDto>

// 완료된 퀴즈(자녀용)
export interface FindChildrenCompletedParams extends CursorByDateId {
  childProfileId: number;
  limit: number;
}
export type FindChildrenCompletedResult = PageResult<ChildrenCompletedItemDto>


// 정답 제출 대상 조회 =============================================

export interface FindAnswerTargetParams {
  childProfileId: number;
  quizId: bigint;
  todayYmd: string;
}

export interface AnswerTargetRow {
  quizId: bigint;
  publishDateYmd: string;
  answer: string;
  reward?: string | null;
  isSolved: boolean;
  authorParentProfileId: number;
  authorParentName?: string | null;
  authorParentAvatarMediaId?: bigint | null;
}


// 통합 읽기 포트 ================================================

export interface QuizQueryPort {
  // 기본 유틸리티
  findLastScheduledDateYmd(parentProfileId: number): Promise<string | null>;
  existsAnyOnDate(parentProfileId: number, ymd: string): Promise<boolean>;

  // 부모용 
  findParentsToday(params: FindParentsTodayParams): Promise<FindParentsTodayResult>;
  findParentsCompleted(params: FindParentsCompletedParams): Promise<FindParentsCompletedResult>;
  findParentsScheduled(params: FindParentsScheduledParams): Promise<FindParentsScheduledResult>;
  findDetailById(quizId: bigint): Promise<QuizDetailRow | null>;

  // 자녀용
  findChildrenToday(params: FindChildrenTodayParams): Promise<FindChildrenTodayResult>;
  findChildrenCompleted(params: FindChildrenCompletedParams): Promise<FindChildrenCompletedResult>;

  // 정답 제출 대상 조회
  findAnswerTarget(params: FindAnswerTargetParams): Promise<AnswerTargetRow | null>;
}
