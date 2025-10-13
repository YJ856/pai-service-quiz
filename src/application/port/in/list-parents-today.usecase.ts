import type { ParentsTodayResponseData } from "pai-shared-types";

export interface ListParentsTodayQuery {
    parentProfileId: string;
    limit: number;
    cursor: string | null;
}

export interface ListParentsTodayUseCase {
    execute(params: ListParentsTodayQuery): Promise<ParentsTodayResponseData>;
}