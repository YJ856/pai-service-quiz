import type { ChildrenCompletedResponseData } from 'pai-shared-types';
import type { ChildrenCompletedCommand } from '../../command/children-completed.command';

export interface ListChildrenCompletedUseCase {
  execute(cmd: ChildrenCompletedCommand): Promise<ChildrenCompletedResponseData>;
}
