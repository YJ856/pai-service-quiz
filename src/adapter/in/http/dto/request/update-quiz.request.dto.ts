import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import type { 
    UpdateQuizPathParam as SharedPath, 
    UpdateQuizRequestDto as SharedBody 
} from "pai-shared-types";
import { TrimString, TrimToNull, TrimToUndefined } from "../common/transforms";

export class UpdateQuizPathParam implements SharedPath {
    @IsString() @IsNotEmpty()
    quizId!: string;
}

export class UpdateQuizRequestDto implements SharedBody {
    @IsString() @IsOptional() @TrimString() @IsNotEmpty()
    question?: string;

    @IsString() @IsOptional() @TrimString() @IsNotEmpty()
    answer?: string;

    @IsString() @IsOptional() @TrimToNull()
    hint?: string | null;

    @IsString() @IsOptional() @TrimToNull()
    reward?: string | null;

    @IsString() @IsOptional() @TrimToNull()
    publishDate!: string | null;
}

/**
 * @IsOptional() + @IsNotEmpty()
 * @IsOptional()은 값이 undefined 또는 null이면 그 필드의 나머지 검증을 전부 스킵
 * @IsNotEmpty()는 빈 문자열 ''(또는 빈 배열 [], 빈 객체 {}) 를 허용X
 * 즉, 두 개를 같이 쓰면 의미는: 이 필드는 안 보내도 되고(스킵), 보내면 비어있으면 안 된다.
 */