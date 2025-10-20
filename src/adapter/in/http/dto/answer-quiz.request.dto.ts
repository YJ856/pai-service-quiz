import { IsString, IsNotEmpty } from 'class-validator';
import { TrimString, TrimToUndefined } from './common/transforms';
import { 
  AnswerQuizPathParam as SharedPath,
  AnswerQuizRequestDto as SharedBody
 } from 'pai-shared-types';

export class AnswerQuizPathParam implements SharedPath {
  @IsString() @IsNotEmpty() @TrimString()
  quizId!: string;
}

export class AnswerQuizRequestDto implements SharedBody {
  @IsString() @TrimToUndefined() @IsNotEmpty() // 빈값이면 400
  answer!: string;
}