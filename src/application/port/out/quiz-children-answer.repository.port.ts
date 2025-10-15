/**
 * 아이 정답 제출을 위한 레포지토리 포트
 * - 대상 퀴즈 조회(채점에 필요한 필드)
 * - 정답 시 isSolved=true 저장
 */

export interface FindAnswerTargetParams {
  /** 자녀 프로필 ID (가드에서 주입) */
  childProfileId: string;
  /** 제출할 퀴즈 ID (path param) */
  quizId: number;
  /**
   * 오늘 날짜(yyyy-MM-dd, KST 기준)
   * - "해당 날짜가 지나면 더 이상 풀 수 없음" 규칙 적용을 위해 사용
   */
  todayYmd: string;
}

/** 채점에 필요한 최소 행(없으면 제출 불가) */
export interface AnswerTargetRow {
  quizId: number;
  status: 'SCHEDULED' | 'TODAY' | 'COMPLETED';
  /** yyyy-MM-dd (KST 기준) */
  publishDateYmd: string;

  /** 정답(서버에서만 사용) */
  answer: string;

  /** 정답 시 내려줄 보상(없으면 null/undefined) */
  reward?: string | null;

  /** 해당 자녀가 이미 풀었는지 여부 */
  isSolved: boolean;

  /** 출제자 정보 (응답 구성용; 보강 전 기본값만 있어도 됨) */
  authorParentProfileId: number;
  authorParentName?: string | null;
  authorParentAvatarMediaId?: number | null;
}

/** isSolved 저장 파라미터 */
export interface MarkSolvedParams {
  childProfileId: string;
  quizId: number;
}

export interface QuizChildrenAnswerRepositoryPort {
  /**
   * 제출 대상 조회
   * - 조건(권장): status='TODAY' && publishDate=오늘(KST) && assignments.some(childProfileId)
   * - 못 찾으면 null 반환(제출 불가)
   */
  findAnswerTarget(params: FindAnswerTargetParams): Promise<AnswerTargetRow | null>;

  /**
   * 정답 처리: 해당 자녀-퀴즈 assignment에 isSolved=true, solvedAt 저장
   * - 이미 isSolved=true면 멱등 처리(에러 없이 그대로 유지)
   */
  markSolved(params: MarkSolvedParams): Promise<void>;
}
