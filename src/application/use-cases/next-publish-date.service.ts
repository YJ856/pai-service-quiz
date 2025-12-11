import { Inject, Injectable } from '@nestjs/common';
import { QUIZ_TOKENS } from '../../quiz.token';
import type { GetNextPublishDateUseCase } from '../port/in/next-publish-date.usecase';
import type { QuizQueryPort } from '../port/out/quiz.query.port';

@Injectable()
export class GetNextPublishDateService implements GetNextPublishDateUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly quizQuery: QuizQueryPort,
  ) {}

  /**
   * 규칙:
   * 1) 예약(SCHEDULED) 중 가장 마지막 날짜 + 1일
   * 2) 예약이 없으면 → 오늘 존재 여부 확인:
   *    - 오늘이 비어있으면: 오늘
   *    - 오늘 이미 있으면: 내일
   * 모두 KST 기준 'yyyy-MM-dd'
   */
  async execute(parentProfileId: number): Promise<string> {
    const last = await this.quizQuery.findLastScheduledDateYmd(parentProfileId);
    if (last) return plusDays(last, 1);

    const today = todayKstYmd();
    const hasToday = await this.quizQuery.existsAnyOnDate(
      parentProfileId,
      today,
    );
    return hasToday ? plusDays(today, 1) : today;
  }
}

/** ---- KST 날짜 유틸 ('yyyy-MM-dd') ---- */
function todayKstYmd(): string {
  const now = new Date();
  const utcMillis = now.getTime() + now.getTimezoneOffset() * 60000;
  const kst = new Date(utcMillis + 9 * 3600000);
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, '0');
  const d = String(kst.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function plusDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
