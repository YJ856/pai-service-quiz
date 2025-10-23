import { IsString, IsNotEmpty, IsNumberString } from 'class-validator';
import { TrimToUndefined, TrimString } from '../common/transforms';
import { 
  AnswerQuizPathParam as SharedPath,
  AnswerQuizRequestDto as SharedBody
 } from 'pai-shared-types';

export class AnswerQuizPathParam implements SharedPath {
  @TrimString() @IsNotEmpty() @IsString() @IsNumberString({ no_symbols: true }) // 부호/소수점 없이 숫자만 허용
  quizId!: string;
}

export class AnswerQuizRequestDto implements SharedBody {
  @TrimToUndefined() @IsString() @IsNotEmpty() // 빈값이면 400
  answer!: string;
}