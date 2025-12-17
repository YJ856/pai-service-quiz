import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsBase64,
} from 'class-validator';
import type { ParentsTodayQueryParam as SharedQuery } from 'pai-shared-types';
import { TrimToUndefined, ToNumberClamped } from '../common/transforms';

export class ParentsTodayQueryParam implements SharedQuery {
  @ToNumberClamped(20, 1, 50)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsString()
  @TrimToUndefined()
  @IsBase64({ urlSafe: true }) // URL-safe(Base64url: -/_)로 인코딩 가능
  cursor?: string;
}
