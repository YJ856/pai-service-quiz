import { Cron, CronExpression, CronOptions } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';
import { TransitionQuizStatusService } from '../../../application/use-cases/transition-quiz-status.service';

@Injectable()
export class QuizCron {
  constructor(private readonly transition: TransitionQuizStatusService) {}

  // 매일 00:00 KST
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Asia/Seoul',   // 꼭 지정
  } as CronOptions)
  async handleDailyTransition() {
    await this.transition.runDaily();
  }
}
