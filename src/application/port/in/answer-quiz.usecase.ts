import type { AnswerQuizResponseData } from 'pai-shared-types';

/**
 * 아이 정답 제출 유스케이스 입력 커맨드
 * - controller에서 childProfileId는 가드(@Auth)로 주입
 * - quizId는 path param
 * - answer/normalize는 request body에서 수신
 */
export interface AnswerQuizCommand {
  childProfileId: string;
  quizId: number;
  answer: string;
  normalize?: boolean;
}

/** 아이 정답 제출 유스케이스 계약 */
export interface AnswerQuizUseCase {
  execute(cmd: AnswerQuizCommand): Promise<AnswerQuizResponseData>;
}
