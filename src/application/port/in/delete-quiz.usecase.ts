import { DeleteQuizCommand } from '../../command/parents-delete-quiz.command';
import type { DeleteQuizResponseResult } from './result/delete-quiz.result.dto';

export interface DeleteQuizUseCase {
  execute(cmd: DeleteQuizCommand): Promise<DeleteQuizResponseResult>;
}
