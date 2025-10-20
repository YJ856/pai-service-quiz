import { IsString, IsNotEmpty } from "class-validator";
import type { ParentsQuizDetailPathParam as SharedParentsQuizDetailPathParam } from "pai-shared-types";
import { TrimString } from "./common/transforms";

export class ParentsQuizDetailPathParam implements SharedParentsQuizDetailPathParam {
    @IsString() @IsNotEmpty() @TrimString()
    quizId!: string;
}