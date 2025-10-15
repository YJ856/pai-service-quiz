import type { ChildrenCompletedResponseData } from 'pai-shared-types';

export interface ListChildrenCompletedQuery {
  childProfileId: string;
  limit: number;
  cursor: string | null; // Base64("publishDate|quizId") 또는 null
}

export interface ListChildrenCompletedUseCase {
  execute(params: ListChildrenCompletedQuery): Promise<ChildrenCompletedResponseData>;
}
