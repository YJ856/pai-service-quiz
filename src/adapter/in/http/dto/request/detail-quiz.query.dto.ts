import { IsNotEmpty, IsInt, IsString } from "class-validator";
import type { ParentsQuizDetailPathParam as SharedParentsQuizDetailPathParam } from "pai-shared-types";


export class ParentsQuizDetailPathParam implements SharedParentsQuizDetailPathParam {
    @IsString() @IsNotEmpty()
    quizId!: string;
}