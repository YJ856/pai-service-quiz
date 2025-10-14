// src/adapter/out/persistence/quiz.query.adapter.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import type { QuizQueryPort } from '../../../application/port/out/quiz.query.port';
import type {
  QuizParentsQueryRepositoryPort,
  FindParentsTodayParams,
  FindParentsTodayResult,
  FindParentsCompletedParams,
  FindParentsCompletedResult,
  FindParentsScheduledParams,
  FindParentsScheduledResult,
} from '../../../application/port/out/quiz-parents-query.repository.port';


@Injectable()
export class QuizQueryAdapter implements QuizQueryPort, QuizParentsQueryRepositoryPort {
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

  async findParentsToday(params: FindParentsTodayParams): Promise<FindParentsTodayResult> {
    const { parentProfileId, todayYmd, limit, afterQuizId } = params;
    const pid = toIntId(parentProfileId);
    const { gte, lt } = utcDayRangeForYmd(todayYmd);

    const rows = await this.prisma.quiz.findMany({
      where: {
        parentProfileId: pid,          // ✅ 네 스키마에 맞춰 parentProfileId 사용
        status: 'TODAY',
        publishDate: { gte, lt },      // ✅ @db.Date 타입 안전 조회
        ...(afterQuizId ? { id: { gt: afterQuizId } } : {}),
      },
      orderBy: { id: 'asc' },
      take: limit + 1,                 // hasNext 판별용
      select: {
        id: true,
        question: true,
        hint: true,
        answer: true,
        reward: true,
        status: true,                  // 'TODAY'
        parentProfileId: true,
        assignments: {
          select: {
            childProfileId: true,
            isSolved: true,
            // completed/보상 조회에도 쓸거라 rewardGranted도 보통 같이 가져가도 OK
            // rewardGranted: true,
          },
        },
      },
    });

    const hasNext = rows.length > limit;
    const page = hasNext ? rows.slice(0, limit) : rows;

    const items = page.map((q) => ({
      quizId: q.id,
      status: 'TODAY' as const,
      question: q.question,
      hint: q.hint ?? undefined,
      answer: q.answer,
      reward: q.reward ?? undefined,

      authorParentProfileId: q.parentProfileId,
      authorParentName: '부모',            
      authorParentAvatarMediaId: null,

      children: (q.assignments ?? []).map((a) => ({
        childProfileId: a.childProfileId,
        childName: '',                     
        childAvatarMediaId: null,          
        isSolved: !!a.isSolved,
      })),
    }));

    return { items, hasNext };
  }

  async findParentsCompleted(params: FindParentsCompletedParams): Promise<FindParentsCompletedResult> {
    const { parentProfileId, limit, after } = params;
    const pid = toIntId(parentProfileId);

    // 커서 조건 (정렬: publishDate DESC, id DESC)
    //  - (publishDate < D) OR (publishDate == D AND id < Q)
    const cursorWhere = after
      ? {
          OR: [
            { publishDate: { lt: ymdToUtcDate(after.publishDateYmd) } },
            {
              AND: [
                { publishDate: ymdToUtcDate(after.publishDateYmd) },
                { id: { lt: after.quizId } },
              ],
            },
          ],
        }
      : {};

    const rows = await this.prisma.quiz.findMany({
      where: {
        parentProfileId: pid,
        status: 'COMPLETED',
        ...cursorWhere,
      },
      orderBy: [
        { publishDate: 'desc' },
        { id: 'desc' },
      ],
      take: limit + 1, // hasNext 판단용
      select: {
        id: true,
        publishDate: true,
        question: true,
        answer: true,
        reward: true,
        parentProfileId: true,
        // 자녀 결과(보상 포함)
        assignments: {
          select: {
            childProfileId: true,
            isSolved: true,
            rewardGranted: true,
          },
        },
      },
    });

    const hasNext = rows.length > limit;
    const page = hasNext ? rows.slice(0, limit) : rows;

    const items = page.map((q) => ({
      quizId: q.id,
      status: 'COMPLETED' as const,
      publishDate: toYmdFromDate(q.publishDate), // 'yyyy-MM-dd'
      question: q.question,
      answer: q.answer,
      reward: q.reward ?? undefined,

      authorParentProfileId: q.parentProfileId,
      authorParentName: '부모',                // ← 외부 user 서비스에서 보강 (서비스에서 merge)
      authorParentAvatarMediaId: null,        // ← 외부 user 서비스에서 보강

      children: (q.assignments ?? []).map((a) => ({
        childProfileId: a.childProfileId,
        childName: '',                        // ← 외부 user 서비스에서 보강
        childAvatarMediaId: null,             // ← 외부 user 서비스에서 보강
        isSolved: !!a.isSolved,
        rewardGranted: !!a.rewardGranted,
      })),
    }));

    return { items, hasNext };
  }

  async findParentsScheduled(params: FindParentsScheduledParams): Promise<FindParentsScheduledResult> {
    const { parentProfileId, limit, after } = params;
    const pid = toIntId(parentProfileId);

    // 커서 조건 (정렬: publishDate ASC, id ASC)
    //  - (publishDate > D) OR (publishDate == D AND id > Q)
    const cursorWhere = after
      ? {
          OR: [
            { publishDate: { gt: ymdToUtcDate(after.publishDateYmd) } },
            {
              AND: [
                { publishDate: ymdToUtcDate(after.publishDateYmd) },
                { id: { gt: after.quizId } },
              ],
            },
          ],
        }
      : {};

    const rows = await this.prisma.quiz.findMany({
      where: {
        parentProfileId: pid,
        status: 'SCHEDULED',
        ...cursorWhere,
      },
      orderBy: [
        { publishDate: 'asc' },
        { id: 'asc' },
      ],
      take: limit + 1, // hasNext 판단용
      select: {
        id: true,
        publishDate: true,
        question: true,
        answer: true,
        hint: true,
        reward: true,
        parentProfileId: true,
      },
    });

    const hasNext = rows.length > limit;
    const page = hasNext ? rows.slice(0, limit) : rows;

    const items = page.map((q) => ({
      quizId: q.id,
      status: 'SCHEDULED' as const,
      publishDate: toYmdFromDate(q.publishDate), // 'yyyy-MM-dd'
      question: q.question,
      answer: q.answer,
      hint: q.hint ?? undefined,
      reward: q.reward ?? undefined,

      authorParentProfileId: q.parentProfileId,
      authorParentName: '부모',                // 서비스에서 실제 프로필 정보로 보강
      authorParentAvatarMediaId: null,        // 서비스에서 보강
      isEditable: false,                       // 서비스에서 최종 계산(본인+SCHEDULED)으로 덮어씀
    }));

    return { items, hasNext };
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

/** 'yyyy-MM-dd' → UTC 00:00 Date (Prisma @db.Date 비교용) */
function ymdToUtcDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}