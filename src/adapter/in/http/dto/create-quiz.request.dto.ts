import { IsOptional, IsNotEmpty, IsString } from 'class-validator';
import type { CreateQuizRequestDto as SharedCreateQuizRequestDto } from 'pai-shared-types';
import { TrimToNull, TrimString } from './common/transforms';

export class CreateQuizRequestDto implements SharedCreateQuizRequestDto {
    @IsString() @IsNotEmpty() @TrimString()
    question!: string;

    @IsString() @IsNotEmpty() @TrimString()
    answer!: string;
    
    @IsOptional() @IsString() @TrimToNull()
    hint?: string | null;

    @IsOptional() @IsString() @TrimToNull()
    reward?: string | null;

    @TrimToNull() @IsOptional() @IsString()
    publishDate: string | null = null;
}

// !: 이 값은 런타임에 반드시 채워질 거라고 보증할게 라는 뜻, 타입스크립트의 컴파일 에러를 잠재우는 표식