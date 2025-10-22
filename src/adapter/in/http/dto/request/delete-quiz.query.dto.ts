import { IsNotEmpty, IsInt, IsString } from 'class-validator';
import type { DeleteQuizPathParam as SharedDeleteQuizPathParam } from 'pai-shared-types';


export class DeleteQuizPathParam implements SharedDeleteQuizPathParam {
    @IsString() @IsNotEmpty()
    quizId!: string;
}