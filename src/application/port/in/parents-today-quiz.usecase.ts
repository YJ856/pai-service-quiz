import type { ParentsTodayResponseResult } from "./result/parents-today-quiz-result.dto";
import type { ParentsTodayQuizCommand } from "../../command/parents-today-quiz.command";

export interface ListParentsTodayUseCase {
    execute(command: ParentsTodayQuizCommand): Promise<ParentsTodayResponseResult>;
}