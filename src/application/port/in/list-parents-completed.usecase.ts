import type { ParentsCompletedResponseData } from 'pai-shared-types';
import type { ParentsCompletedCommand } from '../../command/parents-completed.command';

export interface ListParentsCompletedUseCase {
  execute(cmd: ParentsCompletedCommand): Promise<ParentsCompletedResponseData>;
}
