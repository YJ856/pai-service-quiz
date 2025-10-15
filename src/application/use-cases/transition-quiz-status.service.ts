// src/application/use-cases/transition-quiz-status.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { QuizStatusTransitionPort } from '../port/out/quiz-status-transition.port';
import { QUIZ_TOKENS } from '../../quiz.token';
import { todayYmd } from '../../utils/date.util';

/**
 * Quiz 상태 전환 서비스
 * 매일 00:00 KST에 실행되어 퀴즈 상태를 자동 전환
 */
@Injectable()
export class TransitionQuizStatusService {
  private readonly logger = new Logger(TransitionQuizStatusService.name);

  constructor(
    @Inject(QUIZ_TOKENS.QuizStatusTransitionPort)
    private readonly statusTransition: QuizStatusTransitionPort,
  ) {}

  /**
   * 매일 00:00 KST에 실행:
   * - 오늘이 된 예약건 → TODAY
   * - 오늘보다 이전인 모든 예약/TODAY → COMPLETED
   */
  async runDaily() {
    const today = todayYmd();

    // 1) 오늘 출제되는 예약건 → TODAY
    const toToday = await this.statusTransition.transitionScheduledToToday(today);

    // 2) 오늘보다 이전(과거)인 예약/TODAY → COMPLETED
    const toCompleted = await this.statusTransition.transitionPastToCompleted(today);

    this.logger.log(
      `Status transitioned: SCHEDULED→TODAY=${toToday}, *→COMPLETED=${toCompleted}`,
    );
  }
}
