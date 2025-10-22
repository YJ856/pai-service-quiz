import type { ChildrenCompletedResponseResult } from "./result/children-completed.result.dto";
import type { ChildrenCompletedCommand } from '../../command/children-completed.command';

export interface ListChildrenCompletedUseCase {
  execute(cmd: ChildrenCompletedCommand): Promise<ChildrenCompletedResponseResult>;
}
