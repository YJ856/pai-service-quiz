import type { ParentsTodayResponseData } from "pai-shared-types";
import type { ParentsTodayCommand } from "../../command/parents-today.command";

export interface ListParentsTodayUseCase {
    execute(cmd: ParentsTodayCommand): Promise<ParentsTodayResponseData>;
}