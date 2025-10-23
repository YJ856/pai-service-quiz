import { IsInt, Min, Max, IsOptional, IsString, IsBase64 } from "class-validator";
import type { ParentsCompletedQueryParam as SharedQuery } from "pai-shared-types";
import { TrimToUndefined, ToNumberClamped } from "../common/transforms";

export class ParentsCompletedQueryDto implements SharedQuery {
    @ToNumberClamped(20, 1, 50)
    @IsInt() @Min(1) @Max(50)
    limit?: number;

    @IsOptional() @IsString() @TrimToUndefined() @IsBase64({ urlSafe: true })
    cursor?: string;
}