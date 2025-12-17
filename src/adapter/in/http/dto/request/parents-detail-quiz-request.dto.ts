import { IsNotEmpty, IsString, IsNumberString } from 'class-validator';
import type { ParentsQuizDetailPathParam as SharedPath } from 'pai-shared-types';
import { TrimString } from '../common/transforms';

export class ParentsQuizDetailPathParam implements SharedPath {
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @IsNumberString({ no_symbols: true })
  quizId!: string;
}
