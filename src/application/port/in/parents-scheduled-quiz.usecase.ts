import type { ParentsScheduledResponseResult } from "./result/parents-scheduled-quiz-result.dto";
import type { ParentsScheduledQuizCommand } from '../../command/parents-scheduled-quiz.command';

export interface ListParentsScheduledUseCase {
  execute(cmd: ParentsScheduledQuizCommand): Promise<ParentsScheduledResponseResult>;
}
