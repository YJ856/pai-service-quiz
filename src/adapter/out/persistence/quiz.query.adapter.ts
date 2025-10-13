// src/adapter/out/persistence/quiz.query.adapter.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import type { QuizQueryPort } from '../../../application/port/out/quiz.query.port';

@Injectable()
export class QuizQueryAdapter implements QuizQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findLastScheduledDateYmd(parentProfileId: string): Promise<string | null> {
    const pid = toIntId(parentProfileId);
    const row = await this.prisma.quiz.findFirst({
      where: { parentProfileId: pid, status: 'SCHEDULED' },
      orderBy: { publishDate: 'desc' },
      select: { publishDate: true },
    });
    if (!row?.publishDate) return null;

    // publishDate는 Date(@db.Date) → 'yyyy-MM-dd'로 변환
    return toYmdFromDate(row.publishDate); 
  }

  async existsAnyOnDate(parentProfileId: string, ymd: string): Promise<boolean> {
    const pid = toIntId(parentProfileId);
    const { gte, lt } = utcDayRangeForYmd(ymd);
    const count = await this.prisma.quiz.count({
      where: {
        parentProfileId: pid,                  // ✅ 필드명
        publishDate: { gte, lt },              // ✅ 날짜 범위
        // 상태 제한이 필요 없다면 그대로 두고, 필요하면 in: [SCHEDULED, TODAY] 등
      },
    });
    return count > 0;
  }
}

/** ---- helpers ---- */
function toIntId(id: string | number): number {
  const n = typeof id === 'string' ? Number(id) : id;
  if (!Number.isFinite(n)) throw new Error('Invalid parentProfileId');
  return n;
}

/** Date(UTC 기준) → 'yyyy-MM-dd' (KST 의미 아님, date-only 그대로 포맷) */
function toYmdFromDate(dt: Date): string {
  // @db.Date는 시간 없는 DATE 타입이라 UTC 00:00로 들어옴
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 'yyyy-MM-dd' → 해당 날짜의 UTC 경계 (gte/lt) */
function utcDayRangeForYmd(ymd: string): { gte: Date; lt: Date } {
  const [y, m, d] = ymd.split('-').map(Number);
  const startUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0);
  const endUtcMs = startUtcMs + 24 * 3600 * 1000;
  return { gte: new Date(startUtcMs), lt: new Date(endUtcMs) };
}