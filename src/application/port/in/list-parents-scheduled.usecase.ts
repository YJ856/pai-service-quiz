import type { ParentsScheduledResponseResult } from "./result/parents-scheduled.result.dto";
import type { ParentsScheduledCommand } from '../../command/parents-scheduled.command';

export interface ListParentsScheduledUseCase {
  execute(cmd: ParentsScheduledCommand): Promise<ParentsScheduledResponseResult>;
}
