import type { ChildrenTodayResponseData } from 'pai-shared-types';

export interface ListChildrenTodayQuery {
  childProfileId: string;
  limit: number;
  cursor: string | null;
}

export interface ListChildrenTodayUseCase {
  execute(params: ListChildrenTodayQuery): Promise<ChildrenTodayResponseData>;
}
