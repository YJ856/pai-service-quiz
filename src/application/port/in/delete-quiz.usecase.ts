import { DeleteQuizCommand } from '../../command/delete-quiz.command';

export interface DeleteQuizUseCase {
  execute(cmd: DeleteQuizCommand): Promise<void>;
}
