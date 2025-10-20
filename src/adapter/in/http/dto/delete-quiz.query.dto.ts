import { IsString, IsNotEmpty } from 'class-validator';
import type { DeleteQuizPathParam as SharedDeleteQuizPathParam } from 'pai-shared-types';
import { TrimString } from './common/transforms';

export class DeleteQuizPathParam implements SharedDeleteQuizPathParam {
    @IsString() @IsNotEmpty() @TrimString()
    quizId!: string;
}