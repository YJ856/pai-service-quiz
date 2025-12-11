import { Inject, Injectable } from '@nestjs/common';
import { QUIZ_TOKENS } from 'src/quiz.token';
import type { GrantRewardUseCase } from '../port/in/parents-grant-reward.usecase';
import type { QuizQueryPort } from '../port/out/quiz.query.port';
import type { QuizCommandPort } from '../port/out/quiz.repository.port';
import { ParentsGrantRewardMapper } from 'src/adapter/in/http/mapper/parents-grant-reward.mapper';
import { ParentsGrantRewardCommand } from '../command/parents-grant-reward.command';
import { ParentsGrantRewardResponseResult } from '../port/in/result/parents-grant-reward-result.dto';

@Injectable()
export class GrantRewardService implements GrantRewardUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizCommandPort)
    private readonly repo: QuizCommandPort,
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly quizQuery: QuizQueryPort,
    private readonly parentsGrantRewardMapper: ParentsGrantRewardMapper,
  ) {}

  async execute(
    command: ParentsGrantRewardCommand,
  ): Promise<ParentsGrantRewardResponseResult> {
    const { quizId, childProfileId, grant } = command;

    // 1) 현재 상태 조회
    const row = await this.quizQuery.findAssignmentsForQuizzes({
      quizIds: [quizId],
      childProfileIds: [childProfileId],
    });
    const current = row[0];
    if (!current) {
      throw new Error('ASSIGNMENT_NOT_FOUND');
    }

    // 2) 미해결 상태에서 보상 부여 불가
    if (grant === true && current.isSolved !== true) {
      throw new Error('CANNOT_GRANT_BEFORE_SOLVED');
    }

    // 3) 멱등성: 이미 동일한 상태면 업데이트 생략
    if (current.rewardGranted === grant) {
      return {
        quizId,
        childProfileId,
        isSolved: current.isSolved,
        rewardGranted: current.rewardGranted,
      };
    }

    // 4) 상태 없데이트
    await this.repo.updateRewardGranted({
      quizId,
      childProfileId,
      rewardGranted: grant,
    });

    // 5) 결과 반환
    return {
      quizId,
      childProfileId,
      isSolved: current.isSolved,
      rewardGranted: grant,
    };
  }
}
