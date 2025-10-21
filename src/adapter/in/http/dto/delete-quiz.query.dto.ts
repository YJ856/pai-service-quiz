import { IsNotEmpty, IsInt } from 'class-validator';
import type { DeleteQuizPathParam as SharedDeleteQuizPathParam } from 'pai-shared-types';


export class DeleteQuizPathParam implements SharedDeleteQuizPathParam {
    @IsInt() @IsNotEmpty()
    quizId!: number;
}