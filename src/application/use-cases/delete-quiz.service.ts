import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { QUIZ_TOKENS } from '../../quiz.token';
import { toYmdFromDate, todayYmd } from '../../utils/date.util';
import { canDelete } from '../../domain/policy/quiz.policy';

import type { DeleteQuizCommand } from '../command/delete-quiz.command';
import type { DeleteQuizUseCase } from '../port/in/delete-quiz.usecase';
import type { QuizQueryPort } from '../port/out/quiz.query.port';
import type { QuizCommandPort } from '../port/out/quiz.repository.port';

@Injectable()
export class DeleteQuizService implements DeleteQuizUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly detailRepo: QuizQueryPort,
    @Inject(QUIZ_TOKENS.QuizCommandPort)
    private readonly deleteRepo: QuizCommandPort,
  ) {}

  /**
   * 부모용 퀴즈 삭제
   * - 작성자 본인만
   * - 상태가 SCHEDULED인 경우에만
   */
  async execute(cmd: DeleteQuizCommand): Promise<void> {
    const { quizId, parentProfileId } = cmd;

    // 1) 대상 조회
    const quiz = await this.detailRepo.findDetailById(quizId);
    if (!quiz) throw new NotFoundException('QUIZ_NOT_FOUND');

    // 2) 권한 & 상태 체크 (도메인 정책 활용)
    const today = todayYmd();
    const publishDateYmd = toYmdFromDate(quiz.publishDate);

    if (!canDelete(publishDateYmd, quiz.parentProfileId, parentProfileId, today)) {
      // 작성자가 아니거나 SCHEDULED 상태가 아님
      if (quiz.parentProfileId !== parentProfileId) {
        throw new ForbiddenException('FORBIDDEN');
      }
      throw new ConflictException('NOT_SCHEDULED');
    }

    // 4) 하드 삭제 수행 (조건부: SCHEDULED & 작성자)
    const affected = await this.deleteRepo.deleteIfScheduledAndAuthor({
      quizId,
      parentProfileId,
    });

    if (affected === 0) {
      // 경합 등으로 상태 변경/부재 시
      throw new ConflictException('NOT_SCHEDULED');
    }
  }
}
