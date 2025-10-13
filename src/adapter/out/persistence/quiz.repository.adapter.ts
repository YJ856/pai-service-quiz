import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Quiz } from '../../../domain/model/quiz';
import type { QuizRepositoryPort } from '../../../application/port/out/quiz.repository.port';

/** yyyy-MM-dd → Date(UTC 00:00) */
function ymdToUtcDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

/** Date(UTC) → yyyy-MM-dd */
function utcDateToYmd(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Injectable()
export class QuizRepositoryAdapter implements QuizRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  /** 신규 퀴즈 저장: 도메인(문자열 날짜) → Prisma(Date) */
  async save(q: Quiz): Promise<Quiz> {
    const created = await this.prisma.quiz.create({
      data: {
        parentProfileId: Number(q.authorParentProfileId),
        question: q.question,
        answer: q.answer,
        reward: q.reward ?? null,
        hint: q.hint ?? null,
        publishDate: ymdToUtcDate(q.publishDate), // ← 변환
        status: q.status as any, // 'SCHEDULED' | 'TODAY' | 'COMPLETED'
      },
    });

    // Prisma(Date) → 도메인(문자열 날짜)
    return new Quiz(
      created.question,
      created.answer,
      utcDateToYmd(created.publishDate),
      created.status as any,
      created.parentProfileId,
      created.hint ?? null,
      created.reward ?? null,
      created.id, // 마지막에 id
    );
  }

  /** 가족의 마지막 예약일(yyyy-MM-dd) */
  async findLastScheduledDateByFamily(parentProfileId: number | string): Promise<string | null> {
    const row = await this.prisma.quiz.findFirst({
      where: { parentProfileId: Number(parentProfileId), status: 'SCHEDULED' as any },
      orderBy: { publishDate: 'desc' },
      select: { publishDate: true },
    });
    return row ? utcDateToYmd(row.publishDate) : null;
  }

  /** (선택) 상세 조회 */
  async findById(id: number): Promise<Quiz | null> {
    const r = await this.prisma.quiz.findUnique({ where: { id } });
    if (!r) return null;
    return new Quiz(
      r.question,
      r.answer,
      utcDateToYmd(r.publishDate),
      r.status as any,
      r.parentProfileId,
      r.hint ?? null,
      r.reward ?? null,
      r.id,
    );
  }
}
