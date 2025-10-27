import type { ChildrenTodayResponseResult } from "./result/children-today.result.dto";
import type { ChildrenTodayCommand } from '../../command/children-today-quiz.command';

export interface ListChildrenTodayUseCase {
  execute(cmd: ChildrenTodayCommand): Promise<ChildrenTodayResponseResult>;
}
