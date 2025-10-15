import type { Quiz } from '../../../domain/model/quiz';
import type { UpdateQuizCommand } from '../../command/update-quiz.command';

/**
 * 부모용 퀴즈 수정 UseCase
 * - 예정(SCHEDULED) 상태에서만 수정 가능
 * - 작성자 본인만 수정 가능
 * - 전달된 필드만 부분 수정 (hint/reward = null 이면 제거)
 */
export interface UpdateQuizUseCase {
  execute(cmd: UpdateQuizCommand): Promise<Quiz>;
}
