import { IsString, IsNotEmpty } from 'class-validator';
import { TrimToUndefined } from './common/transforms';
import { 
  AnswerQuizPathParam as SharedPath,
  AnswerQuizRequestDto as SharedBody
 } from 'pai-shared-types';

export class AnswerQuizPathParamDto implements SharedPath {
  @IsString()
  @IsNotEmpty()
  quizId!: string;
}

export class AnswerQuizRequestDto implements SharedBody {
  @IsString()
  @TrimToUndefined()
  @IsNotEmpty() // 빈값이면 400
  answer!: string;
}