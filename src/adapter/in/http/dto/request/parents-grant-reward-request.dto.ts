import { IsNotEmpty, IsString, IsNumberString, IsInt, IsPositive, IsDefined, IsBoolean } from "class-validator";
import { ToNumber, TrimString } from "../common/transforms";
import type { 
    ParentsGrantRewardPathParam as SharedPath, 
    ParentsGrantRewardRequestDto as SharedBody
 } from 'pai-shared-types';

export class ParentsGrantRewardPathParam implements SharedPath {
    @TrimString() @IsNotEmpty() @IsString() @IsNumberString({ no_symbols: true })
    quizId!: string;

    @ToNumber() @IsInt() @IsPositive()
    childProfileId!: number;
}

export class ParentsGrantRewardRequestDto implements SharedBody {
    @IsDefined() @IsBoolean()
    grant!: boolean;
}