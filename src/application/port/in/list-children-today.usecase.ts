import type { ChildrenTodayResponseData } from 'pai-shared-types';
import type { ChildrenTodayCommand } from '../../command/children-today.command';

export interface ListChildrenTodayUseCase {
  execute(cmd: ChildrenTodayCommand): Promise<ChildrenTodayResponseData>;
}
