import { ParentsDeleteQuizCommand } from '../../command/parents-delete-quiz.command';
import type { DeleteQuizResponseResult } from './result/parents-delete-quiz-result.dto';

export interface DeleteQuizUseCase {
  execute(cmd: ParentsDeleteQuizCommand): Promise<DeleteQuizResponseResult>;
}
