import { IsNotEmpty, IsInt } from "class-validator";
import type { ParentsQuizDetailPathParam as SharedParentsQuizDetailPathParam } from "pai-shared-types";


export class ParentsQuizDetailPathParam implements SharedParentsQuizDetailPathParam {
    @IsInt() @IsNotEmpty()
    quizId!: number;
}