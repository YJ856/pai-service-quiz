import type { ParentsCompletedResponseResult } from "./result/parents-completed-quiz-result.dto";
import type { ParentsCompletedQuizCommand } from '../../command/parents-completed-quiz.command';

export interface ListParentsCompletedUseCase {
  execute(command: ParentsCompletedQuizCommand): Promise<ParentsCompletedResponseResult>;
}
