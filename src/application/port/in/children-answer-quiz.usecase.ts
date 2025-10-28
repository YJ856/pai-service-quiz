import type { AnswerQuizResponseResult } from "./result/parents-answer-quiz-result.dto";
import type { ChildrenAnswerQuizCommand } from '../../command/children-answer-quiz.command';

/**
 * 아이 정답 제출 유스케이스 계약
 * - controller에서 childProfileId는 가드(@Auth)로 주입
 * - quizId는 path param (string)
 * - answer는 request body에서 수신
 */
export interface AnswerQuizUseCase {
  execute(command: ChildrenAnswerQuizCommand): Promise<AnswerQuizResponseResult>;
}
