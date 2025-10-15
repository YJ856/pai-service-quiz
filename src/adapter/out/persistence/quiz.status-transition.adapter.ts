import { Injectable } from '@nestjs/common';
import type { QuizStatusTransitionPort } from '../../../application/port/out/quiz-status-transition.port';
import { PrismaService } from './prisma/prisma.service';
import { utcDayRangeForYmd } from '../../../utils/date.util';

/**
 * Quiz 상태 전환 어댑터
 * QuizStatusTransitionPort의 Prisma 구현체
 */
@Injectable()
export class QuizStatusTransitionAdapter implements QuizStatusTransitionPort {
  constructor(private readonly prisma: PrismaService) {}

  async transitionScheduledToToday(todayYmd: string): Promise<number> {
    const { gte, lt } = utcDayRangeForYmd(todayYmd);

    const result = await this.prisma.quiz.updateMany({
      where: {
        status: 'SCHEDULED',
        publishDate: { gte, lt },
      },
      data: { status: 'TODAY' },
    });

    return result.count;
  }

  async transitionPastToCompleted(todayYmd: string): Promise<number> {
    const { gte } = utcDayRangeForYmd(todayYmd);

    const result = await this.prisma.quiz.updateMany({
      where: {
        status: { in: ['SCHEDULED', 'TODAY'] },
        publishDate: { lt: gte },
      },
      data: { status: 'COMPLETED' },
    });

    return result.count;
  }
}
