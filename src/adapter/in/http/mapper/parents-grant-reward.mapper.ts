import { Injectable } from '@nestjs/common';
import { ParentsGrantRewardRequestDto } from '../dto/request/parents-grant-reward-request.dto';
import type { ParentsGrantRewardResponseData } from 'pai-shared-types';
import type { ParentsGrantRewardResponseResult } from 'src/application/port/in/result/parents-grant-reward-result.dto';
import { ParentsGrantRewardCommand } from 'src/application/command/parents-grant-reward.command';

@Injectable()
export class ParentsGrantRewardMapper {
  toCommand(
    quizId: string,
    childProfileId: number,
    dto: ParentsGrantRewardRequestDto,
  ): ParentsGrantRewardCommand {
    return new ParentsGrantRewardCommand(
      BigInt(quizId), // string -> bigint 변환
      childProfileId,
      dto.grant,
    );
  }

  toResponse(
    result: ParentsGrantRewardResponseResult,
  ): ParentsGrantRewardResponseData {
    return {
      quizId: result.quizId.toString(),
      childProfileId: result.childProfileId,
      isSolved: result.isSolved,
      rewardGranted: result.rewardGranted,
    };
  }
}
