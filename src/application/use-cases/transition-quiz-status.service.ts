// src/application/use-cases/transition-quiz-status.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../adapter/out/persistence/prisma/prisma.service';

@Injectable()
export class TransitionQuizStatusService {
  private readonly logger = new Logger(TransitionQuizStatusService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 매일 00:00 KST에 실행:
   * - 오늘이 된 예약건 → TODAY
   * - 오늘보다 이전인 모든 예약/TODAY → COMPLETED
   */
  async runDaily() {
    const todayYmd = getTodayYmdKST();
    const { gte: todayStartUtc, lt: tomorrowStartUtc } = utcDayRangeForYmd(todayYmd);

    // 1) 오늘 출제되는 예약건 → TODAY
    const toToday = await this.prisma.quiz.updateMany({
      where: {
        status: 'SCHEDULED',
        publishDate: { gte: todayStartUtc, lt: tomorrowStartUtc },
      },
      data: { status: 'TODAY' },
    });

    // 2) 오늘보다 이전(과거)인 예약/TODAY → COMPLETED
    const toCompleted = await this.prisma.quiz.updateMany({
      where: {
        status: { in: ['SCHEDULED', 'TODAY'] },
        publishDate: { lt: todayStartUtc },
      },
      data: { status: 'COMPLETED' },
    });

    this.logger.log(
      `Status transitioned: SCHEDULED→TODAY=${toToday.count}, *→COMPLETED=${toCompleted.count}`,
    );
  }
}

/** === helpers (우리 다른 파일들에서 쓰던 것과 동일) === */
function getTodayYmdKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function utcDayRangeForYmd(ymd: string): { gte: Date; lt: Date } {
  const [y, m, d] = ymd.split('-').map(Number);
  const startUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0);
  const endUtcMs = startUtcMs + 24 * 3600 * 1000;
  return { gte: new Date(startUtcMs), lt: new Date(endUtcMs) };
}
