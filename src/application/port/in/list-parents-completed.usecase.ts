import type { ParentsCompletedResponseData } from 'pai-shared-types';

export interface ListParentsCompletedQuery {
  parentProfileId: string;
  limit: number;
  cursor: string | null;
}

export interface ListParentsCompletedUseCase {
  execute(params: ListParentsCompletedQuery): Promise<ParentsCompletedResponseData>;
}
