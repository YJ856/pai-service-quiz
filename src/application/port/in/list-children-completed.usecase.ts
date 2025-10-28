import type { ChildrenCompletedResponseResult } from "./result/children-completed-quiz-result.dto";
import type { ChildrenCompletedQuizCommand } from '../../command/children-completed-quiz.command';

export interface ListChildrenCompletedUseCase {
  execute(cmd: ChildrenCompletedQuizCommand): Promise<ChildrenCompletedResponseResult>;
}
