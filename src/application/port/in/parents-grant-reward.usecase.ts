import type { ParentsGrantRewardResponseResult } from './result/parents-grant-reward-result.dto';
import type { ParentsGrantRewardCommand } from 'src/application/command/parents-grant-reward.command';

export interface GrantRewardUseCase {
  execute(
    command: ParentsGrantRewardCommand,
  ): Promise<ParentsGrantRewardResponseResult>;
}
