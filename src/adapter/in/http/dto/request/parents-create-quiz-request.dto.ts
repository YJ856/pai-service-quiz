import { IsOptional, IsNotEmpty, IsString } from 'class-validator';
import type { CreateQuizRequestDto as SharedBody } from 'pai-shared-types';
import { TrimToNull, TrimString } from '../common/transforms';

export class CreateQuizRequestDto implements SharedBody {
  @TrimString()
  @IsString()
  @IsNotEmpty()
  question!: string;

  @TrimString()
  @IsString()
  @IsNotEmpty()
  answer!: string;

  @TrimToNull()
  @IsOptional()
  @IsString()
  hint: string | null = null; // 기본값으로 키 존재 보장

  @TrimToNull()
  @IsOptional()
  @IsString()
  reward: string | null = null;

  @TrimToNull()
  @IsOptional()
  @IsString()
  publishDate: string | null = null;
}

// !: 이 값은 런타임에 반드시 채워질 거라고 보증할게 라는 뜻, 타입스크립트의 컴파일 에러를 잠재우는 표식
