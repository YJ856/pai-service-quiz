import { IsNotEmpty, IsString, IsNumberString } from 'class-validator';
import type { DeleteQuizPathParam as SharedPath } from 'pai-shared-types';
import { TrimString } from '../common/transforms';

export class DeleteQuizPathParam implements SharedPath {
    @TrimString() @IsString() @IsNotEmpty() @IsNumberString({ no_symbols: true })
    quizId!: string;
}