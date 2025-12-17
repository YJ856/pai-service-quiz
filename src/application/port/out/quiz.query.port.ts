// 공통 타입 ===============================================
export interface PageResult<T> {
  items: T[];
  hasNext: boolean;
}

// 커서 유형(두 가지)
export interface CursorById {
  paginationCursor?: bigint;
}
export interface CursorByDateId {
  paginationCursor?: { publishDateYmd: string; quizId: bigint };
}

// 부모용 조회 ===============================================

// 오늘의 퀴즈 전체 조회
export interface FindFamilyParentsTodayParams extends CursorById {
  parentProfileIds: number[];
  dateYmd: string;
  limit: number;
}
export type FamilyParentsTodayRow = {
  quizId: bigint;
  publishDateYmd: string;
  question: string;
  answer: string;
  reward: string | null;
  hint: string | null;
  authorParentProfileId: number;
};
export type FindFamilyParentsTodayResult = PageResult<FamilyParentsTodayRow>;

// 완료된 퀴즈 전체 조회
export interface FindFamilyParentsCompletedParams extends CursorByDateId {
  // 탐색 의뢰서
  parentProfileIds: number[];
  beforeDateYmd: string; // 탐색 기준(상한선: 이 날짜보다 이전 날짜)
  limit: number;
}
export type FamilyParentsCompletedRow = {
  // 발견한 기록 한 줄
  quizId: bigint;
  publishDateYmd: string;
  question: string;
  answer: string;
  reward: string | null;
  authorParentProfileId: number;
};
export type FindFamilyParentsCompletedResult =
  PageResult<FamilyParentsCompletedRow>; // 탐색 보고서(페이지네이션 포함)

// 예정된 퀴즈 전체 조회
export interface FindFamilyParentsScheduledParams extends CursorByDateId {
  parentProfileIds: number[];
  afterDateYmd: string;
  limit: number;
}
export type FamilyParentsScheduledRow = {
  quizId: bigint;
  publishDateYmd: string;
  question: string;
  answer: string;
  hint: string | null;
  reward: string | null;
  authorParentProfileId: number;
};
export type FindFamilyParentsScheduledResult =
  PageResult<FamilyParentsScheduledRow>;

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

// 오늘의 퀴즈(자녀용): 부모용 재사용

// 완료된 퀴즈(자녀용)
export interface FindChildrenCompletedParams extends CursorByDateId {
  childProfileId: number;
  beforeDateYmd: string;
  limit: number;
}
export type ChildrenCompletedRow = {
  quizId: bigint;
  publishDateYmd: string;
  question: string;
  answer: string;
  reward: string | null;
  authorParentProfileId: number;
};
export type FindChildrenCompletedResult = PageResult<ChildrenCompletedRow>;

// 통합 읽기 포트 ================================================

export interface QuizQueryPort {
  // 기본 유틸리티
  findLastScheduledDateYmd(parentProfileId: number): Promise<string | null>;
  existsAnyOnDate(parentProfileId: number, ymd: string): Promise<boolean>;

  // 부모용
  findDetailById(quizId: bigint): Promise<QuizDetailRow | null>;

  // 자녀(개인) 완료 목록
  findChildrenCompleted(
    params: FindChildrenCompletedParams,
  ): Promise<FindChildrenCompletedResult>;

  // 가족(다수 부모)용 오늘 목록
  findFamilyParentsToday(
    params: FindFamilyParentsTodayParams,
  ): Promise<FindFamilyParentsTodayResult>;

  // 가족(다수 부모)용 완료 목록
  findFamilyParentsCompleted(
    params: FindFamilyParentsCompletedParams,
  ): Promise<FindFamilyParentsCompletedResult>;

  // 가족(다수 부모)용 예정 목록
  findFamilyParentsScheduled(
    params: FindFamilyParentsScheduledParams,
  ): Promise<FindFamilyParentsScheduledResult>;

  // (퀴즈들 x 자녀들) 과제/보상 상태 조회
  findAssignmentsForQuizzes(params: {
    quizIds: bigint[];
    childProfileIds: number[];
  }): Promise<
    Array<{
      quizId: bigint;
      childProfileId: number;
      isSolved: boolean;
      rewardGranted: boolean;
    }>
  >;
}
