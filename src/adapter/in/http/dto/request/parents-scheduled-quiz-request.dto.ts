import { IsInt, Min, Max, IsOptional, IsString, IsBase64 } from "class-validator";
import type { ParentsScheduledQueryParam as SharedQuery } from "pai-shared-types";
import { TrimToUndefined, ToNumberClamped } from "../common/transforms";

export class ParentsScheduledQueryDto implements SharedQuery {
    @ToNumberClamped(20, 1, 50)
    @IsInt() @Min(1) @Max(50)
    limit?: number;

    @IsOptional() @IsString() @TrimToUndefined() @IsBase64({ urlSafe: true })
    cursor?: string;
}