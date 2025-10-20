import { IsInt, Min, Max, IsOptional, IsString, IsBase64 } from "class-validator";
import type { ParentsTodayQueryDto as SharedParentsTodayQueryDto } from "pai-shared-types";
import { TrimToUndefined, ToNumberClamped } from "./common/transforms";

export class ParentsTodayQueryDto implements SharedParentsTodayQueryDto {
    @ToNumberClamped(20, 1, 50)
    @IsInt() @Min(1) @Max(50)
    limit?: number;

    @IsOptional() @IsString() @TrimToUndefined() @IsBase64()
    cursor?: string;
}