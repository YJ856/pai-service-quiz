import type { ChildrenTodayResponseResult } from "./result/children-today.result.dto";
import type { ChildrenTodayCommand } from '../../command/children-today.command';

export interface ListChildrenTodayUseCase {
  execute(cmd: ChildrenTodayCommand): Promise<ChildrenTodayResponseResult>;
}
