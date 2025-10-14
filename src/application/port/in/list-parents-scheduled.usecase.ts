import type { ParentsScheduledResponseData } from 'pai-shared-types';

export interface ListParentsScheduledQuery {
  parentProfileId: string;
  limit: number;
  cursor: string | null;
}

export interface ListParentsScheduledUseCase {
  execute(params: ListParentsScheduledQuery): Promise<ParentsScheduledResponseData>;
}
