import type { ParentsScheduledResponseData } from 'pai-shared-types';
import type { ParentsScheduledCommand } from '../../command/parents-scheduled.command';

export interface ListParentsScheduledUseCase {
  execute(cmd: ParentsScheduledCommand): Promise<ParentsScheduledResponseData>;
}
