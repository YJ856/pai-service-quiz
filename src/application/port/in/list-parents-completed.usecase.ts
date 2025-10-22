import type { ParentsCompletedResponseResult } from "./result/parents-completed.result.dto";
import type { ParentsCompletedCommand } from '../../command/parents-completed.command';

export interface ListParentsCompletedUseCase {
  execute(cmd: ParentsCompletedCommand): Promise<ParentsCompletedResponseResult>;
}
