import { IsInt, Min, Max, IsOptional, IsString, IsBase64 } from 'class-validator';
import type { ChildrenTodayQueryDto as SharedChildrenTodayQueryDto } from 'pai-shared-types';
import { TrimToUndefined, ToNumberClamped } from './common/transforms';

export class ChildrenTodayQueryDto implements SharedChildrenTodayQueryDto {
    @ToNumberClamped(20, 1, 50)
    @IsInt() @Min(1) @Max(50)
    limit?: number; // 컨트롤러에 들어올 땐 이미 number | undefined

    @IsOptional() @IsString() @TrimToUndefined() @IsBase64()
    cursor?: string;
}