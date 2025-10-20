import { IsInt, Min, Max, IsOptional, IsString, IsBase64 } from 'class-validator';
import type { ChildrenCompletedQueryDto as SharedChildrenCompletedQueryDto } from 'pai-shared-types';
import { TrimToUndefined, ToNumberClamped } from './common/transforms';

export class ChildrenCompletedQueryDto implements SharedChildrenCompletedQueryDto {
    @ToNumberClamped(20, 1, 50)
    // 여기부터는 문서적 의미 + 이중 안정망
    @IsInt() @Min(1) @Max(50)
    limit?: number;

    @IsOptional() @IsString() @TrimToUndefined() @IsBase64()
    cursor?: string;
}