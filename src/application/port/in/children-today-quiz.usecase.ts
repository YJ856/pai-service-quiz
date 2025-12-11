import type { ChildrenTodayResponseResult } from './result/children-today-quiz-result.dto';
import type { ChildrenTodayQuizCommand } from '../../command/children-today-quiz.command';

export interface ListChildrenTodayUseCase {
  execute(cmd: ChildrenTodayQuizCommand): Promise<ChildrenTodayResponseResult>;
}
