import type { ParentsTodayResponseResult } from "./result/parents-today.result.dto";
import type { ParentsTodayCommand } from "../../command/parents-today.command";

export interface ListParentsTodayUseCase {
    execute(cmd: ParentsTodayCommand): Promise<ParentsTodayResponseResult>;
}