import { IsInt, Min, Max, IsOptional, IsString, IsBase64 } from "class-validator";
import type { ParentsCompletedQueryDto as SharedParentsCompletedQueryDto } from "pai-shared-types";
import { TrimToUndefined, ToNumberClamped } from "./common/transforms";

export class ParentsCompletedQueryDto implements SharedParentsCompletedQueryDto {
    @ToNumberClamped(20, 1, 50)
    @IsInt() @Min(1) @Max(50)
    limit?: number;

    @IsOptional() @IsString() @TrimToUndefined() @IsBase64()
    cursor?: string;
}