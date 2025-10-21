import { IsString, IsNotEmpty, IsInt } from 'class-validator';
import { TrimToUndefined } from '../common/transforms';
import { 
  AnswerQuizPathParam as SharedPath,
  AnswerQuizRequestDto as SharedBody
 } from 'pai-shared-types';

export class AnswerQuizPathParam implements SharedPath {
  @IsNotEmpty() @IsInt() 
  quizId!: number;
}

export class AnswerQuizRequestDto implements SharedBody {
  @IsString() @TrimToUndefined() @IsNotEmpty() // 빈값이면 400
  answer!: string;
}