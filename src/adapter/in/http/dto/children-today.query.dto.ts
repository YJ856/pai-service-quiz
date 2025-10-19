import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import type { ChildrenTodayQueryDto as SharedChildrenTodayQueryDto } from 'pai-shared-types';
import { TrimToUndefined, ToNumber } from './common/transforms';

export class ChildrenTodayQueryDto implements SharedChildrenTodayQueryDto {
    @IsOptional()
    @ToNumber() // '' | null | undefined -> undefined, 그 외 Number(...)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number; // 컨트롤러에 들어올 땐 이미 number | undefined

    @IsOptional()
    @IsString()
    @TrimToUndefined()
    cursor?: string;
}