/**
 * UpdateQuiz UseCase가 받는 내부 입력 모델
 * - 외부 DTO로부터 분리된 순수 도메인 커맨드
 * - 부분 수정: 전달된 필드만 업데이트
 * - hint/reward = null이면 DB에서 제거
 */
export interface UpdateQuizCommand {
  /** 수정 대상 퀴즈 ID */
  quizId: number;
  /** 작성자 본인 확인용 부모 프로필 ID (가드에서 string으로 들어올 수 있음) */
  parentProfileId: string | number;

  /** 선택 필드: 전달된 항목만 부분 수정 */
  question?: string;
  answer?: string;
  hint?: string | null;
  reward?: string | null;
  /** 'yyyy-MM-dd' 형식 */
  publishDate?: string;
}
