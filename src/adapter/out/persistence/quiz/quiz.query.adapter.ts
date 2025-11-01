import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  QuizQueryPort,
  FindFamilyParentsCompletedParams,
  FindFamilyParentsCompletedResult,
  FamilyParentsCompletedRow,
  FindChildrenCompletedParams,
  FindChildrenCompletedResult,
  FindAnswerTargetParams,
  AnswerTargetRow,
  QuizDetailRow,
  FindFamilyParentsTodayParams,
  FindFamilyParentsTodayResult,
  FamilyParentsTodayRow,
  FindFamilyParentsScheduledParams,
  FindFamilyParentsScheduledResult,
  FamilyParentsScheduledRow,
  ChildrenCompletedRow
}
from '../../../../application/port/out/quiz.query.port';
import type { MarkSolvedParams } from '../../../../application/port/out/quiz.repository.port';
import { toYmdFromDate, ymdToUtcDate, utcDayRangeForYmd, todayYmdKST } from '../../../../utils/date.util';

@Injectable()
export class QuizQueryAdapter implements QuizQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findLastScheduledDateYmd(parentProfileId: number): Promise<string | null> {
    const today = todayYmdKST();

    // SCHEDULED = publishDate > today(KST)
    const resultRecords = await this.prisma.quiz.findFirst({
      where: {
        parentProfileId,
        publishDate: { gt: ymdToUtcDate(today) }  // publishDate > today
      },
      orderBy: { publishDate: 'desc' },
      select: { publishDate: true },
    });
    if (!resultRecords?.publishDate) return null;

    // publishDate는 Date(@db.Date) → 'yyyy-MM-dd'로 변환
    return toYmdFromDate(resultRecords.publishDate);
  }

  async existsAnyOnDate(parentProfileId: number, ymd: string): Promise<boolean> {
    const { startUtc, endUtc } = utcDayRangeForYmd(ymd);
    const count = await this.prisma.quiz.count({
      where: {
        parentProfileId,                       // ✅ 필드명
        publishDate: { gte: startUtc, lt: endUtc },              // ✅ 날짜 범위
      },
    });
    return count > 0;
  }

  // 가족(다수 부모)의 오늘(동일 날짜) 퀴즈 페이지 조회: id DESC
  async findFamilyParentsToday(params: FindFamilyParentsTodayParams): Promise<FindFamilyParentsTodayResult> {
    const { parentProfileIds, dateYmd, paginationCursor, limit } = params;

    if (!parentProfileIds?.length) return { items: [], hasNext: false};

    const { startUtc, endUtc } = utcDayRangeForYmd(dateYmd);

    const cursorWhere = paginationCursor ? { id: { lt: paginationCursor }} : {};

    const resultRecords = await this.prisma.quiz.findMany({
      where: {
        parentProfileId: { in: parentProfileIds },
        publishDate: { gte: startUtc, lt: endUtc },
        ...cursorWhere,
      },
      orderBy: { id: 'desc' },
      take: limit + 1,
      select: {
        id: true,
        publishDate: true,
        question: true,
        answer: true,
        reward: true,
        hint: true,
        parentProfileId: true,
      },
    });

    const hasNext = resultRecords.length > limit;
    const page = hasNext ? resultRecords.slice(0, limit) : resultRecords;

    const items: FamilyParentsTodayRow[] = page.map((row) => ({
      quizId: row.id as unknown as bigint,
      publishDateYmd: row.publishDate.toISOString().slice(0, 10),
      question: row.question,
      answer: row.answer,
      reward: row.reward ?? null,
      hint: row.hint ?? null,
      authorParentProfileId: row.parentProfileId,
    }));

    return { items, hasNext }
  }

  // 가족(다수 부모)의 오늘 이전(완료된) 퀴즈 페이지 조회(DESC)
  async findFamilyParentsCompleted(params: FindFamilyParentsCompletedParams): Promise<FindFamilyParentsCompletedResult> {
    const { parentProfileIds, beforeDateYmd, paginationCursor, limit } = params;

    if (!parentProfileIds?.length) { return { items: [], hasNext: false}; }

    const publishDateCutoffUtcExclusive  = ymdToUtcDate(beforeDateYmd);

    const cursorWhere = paginationCursor
      ? {
        OR: [
          { publishDate: { lt: ymdToUtcDate(paginationCursor.publishDateYmd) } }, // lt: lessThan
          {
            AND: [
              { publishDate: ymdToUtcDate(paginationCursor.publishDateYmd) },
              { id: { lt: paginationCursor.quizId } },
            ],
          },
        ],
      }
      : {};
    
    const resultRecords = await this.prisma.quiz.findMany({
      where: {
        parentProfileId: { in: parentProfileIds },
        publishDate: { lt: publishDateCutoffUtcExclusive  },
        ...cursorWhere,
      },
      orderBy: [{ publishDate: 'desc' }, { id: 'desc' }],
      take: limit + 1, // hasNext 판별
      select: {
        id: true,
        publishDate: true,
        question: true,
        answer: true,
        reward: true,
        parentProfileId: true,
      },
    });

    const hasNext = resultRecords.length > limit;
    const page = hasNext ? resultRecords.slice(0, limit) : resultRecords;

    const items: FamilyParentsCompletedRow[] = page.map((row) => ({
      quizId: row.id as unknown as bigint,
      publishDateYmd: row.publishDate.toISOString().slice(0, 10),
      question: row.question,
      answer: row.answer,
      reward: row.reward ?? null,
      authorParentProfileId: row.parentProfileId,
    }));

    return { items, hasNext };
  }

  // 가족(다수 부모)의 오늘 이후(예정된) 퀴즈 페이지 조회
  async findFamilyParentsScheduled(params: FindFamilyParentsScheduledParams): Promise<FindFamilyParentsScheduledResult> {
      const { parentProfileIds, afterDateYmd, paginationCursor, limit } = params;

      if (!parentProfileIds?.length) { return { items: [], hasNext: false}; };

      const { endUtc } = utcDayRangeForYmd(afterDateYmd);

      const cursorWhere = paginationCursor
        ? {
            OR: [
              { publishDate: { gt: ymdToUtcDate(paginationCursor.publishDateYmd) } },
              {
                AND: [
                  { publishDate: ymdToUtcDate(paginationCursor.publishDateYmd) },
                  { id: { gt: paginationCursor.quizId } },
                ],
              },
            ],
          }
        : {};

      const resultRecords = await this.prisma.quiz.findMany({
        where: {
          parentProfileId: { in: parentProfileIds },
          publishDate: { gte: endUtc },
          ...cursorWhere,
        },
        orderBy: [{ publishDate: 'asc' }, { id: 'asc' }],
        take: limit + 1,
        select: {
          id: true,
          publishDate: true,
          question: true,
          answer: true,
          reward: true,
          hint: true,
          parentProfileId: true,
        },
      });

      const hasNext = resultRecords.length > limit;
      const page = hasNext ? resultRecords.slice(0, limit) : resultRecords;

      const items: FamilyParentsScheduledRow[] = page.map((row) => ({
        quizId: row.id as unknown as bigint,
        publishDateYmd: row.publishDate.toISOString().slice(0, 10),
        question: row.question,
        answer: row.answer,
        reward: row.reward ?? null,
        hint: row.hint ?? null,
        authorParentProfileId: row.parentProfileId,
      }));

      return { items, hasNext }
  }

  // 이번 페이지의 quizIds x childIds 제출/보상 조회
  async findAssignmentsForQuizzes(params: {
    quizIds: bigint[];
    childProfileIds: number[];
  }): Promise<Array<{ quizId: bigint; childProfileId: number; isSolved: boolean; rewardGranted: boolean }>> {
    const { quizIds, childProfileIds } = params;

    if (!quizIds?.length || !childProfileIds.length) return [];

    const resultRecords = await this.prisma.assignment.findMany({
      where: {
        quizId: { in: quizIds as any },
        childProfileId: { in: childProfileIds },
      },
      select: {
        quizId: true,
        childProfileId: true,
        isSolved: true,
        rewardGranted: true,
      },
    });

    return resultRecords.map((record) => ({
      quizId: record.quizId as unknown as bigint,
      childProfileId: record.childProfileId,
      isSolved: !!record.isSolved,
      rewardGranted: !!record.rewardGranted,
    }));
  }

  async findDetailById(quizId: bigint): Promise<QuizDetailRow | null> {
    const resultRecords = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        question: true,
        answer: true,
        hint: true,
        reward: true,
        publishDate: true,    // @db.Date → Date
        parentProfileId: true,
      },
    });

    if (!resultRecords) return null;

    return {
      id: resultRecords.id,
      question: resultRecords.question,
      answer: resultRecords.answer,
      hint: resultRecords.hint ?? null,
      reward: resultRecords.reward ?? null,
      publishDate: resultRecords.publishDate,
      parentProfileId: resultRecords.parentProfileId,
    };
  }

  // 자녀(개인)의 오늘 퀴즈 조회: findFamilyParentsToday 재사용
  

  // 자녀(개인)의 오늘 이전(완료된) 퀴즈 조회
  async findChildrenCompleted(params: FindChildrenCompletedParams,): Promise<FindChildrenCompletedResult> {
    const { childProfileId, beforeDateYmd, paginationCursor, limit } = params;

    const publishDateCutoffUtcExclusive = ymdToUtcDate(beforeDateYmd);

    const cursorWhere = paginationCursor
      ? {
          OR: [
            { quiz: { publishDate: { lt: ymdToUtcDate(paginationCursor.publishDateYmd) } } },
            {
              AND: [
                { quiz: { publishDate: ymdToUtcDate(paginationCursor.publishDateYmd) } },
                { quizId: { lt: paginationCursor.quizId } },
              ],
            },
          ],
        }
      : {};

    const resultRecords = await this.prisma.assignment.findMany({
      where: {
        childProfileId,
        isSolved: true,
        quiz: { publishDate: { lt: publishDateCutoffUtcExclusive } },
        ...cursorWhere,
      },
      orderBy: [
        { quiz: { publishDate: 'desc' } },
        { quizId: 'desc' },
      ],
      take: limit + 1,
      select: {
        quizId: true,
        quiz: {
          select: {
            publishDate: true,
            question: true,
            answer: true,
            reward: true,
            parentProfileId: true,
          },
        },
      },
    });

    const hasNext = resultRecords.length > limit;
    const page = hasNext ? resultRecords.slice(0, limit) : resultRecords;

    const items: ChildrenCompletedRow[] = page.map((row) => ({
      quizId: row.quizId as unknown as bigint,
      publishDateYmd: row.quiz.publishDate.toISOString().slice(0, 10),
      question: row.quiz.question,
      answer: row.quiz.answer,
      reward: row.quiz.reward ?? null,
      authorParentProfileId: row.quiz.parentProfileId,
    }));

    return { items, hasNext };
  }

  async findAnswerTarget(params: FindAnswerTargetParams): Promise<AnswerTargetRow | null> {
    const { childProfileId, quizId, todayYmd } = params;
    const { startUtc, endUtc } = utcDayRangeForYmd(todayYmd);

    // TODAY = publishDate = today(KST)
    const resultRecords = await this.prisma.quiz.findFirst({
      where: {
        id: quizId,
        publishDate: { gte: startUtc, lt: endUtc }, // publishDate = today
        assignments: {
          some: { childProfileId }, // 본인에게 배정된 퀴즈만
        },
      },
      select: {
        id: true,
        publishDate: true,
        answer: true,
        reward: true,
        parentProfileId: true,
        // 자녀 자신의 완료 여부만 조회
        assignments: {
          where: { childProfileId },
          select: { isSolved: true },
          take: 1,
        },
      },
    });

    if (!resultRecords) return null;

    return {
      quizId: resultRecords.id,
      publishDateYmd: toYmdFromDate(resultRecords.publishDate), // 'yyyy-MM-dd'
      answer: resultRecords.answer,
      reward: resultRecords.reward ?? null,
      isSolved: !!resultRecords.assignments?.[0]?.isSolved,
      authorParentProfileId: resultRecords.parentProfileId,
      authorParentName: '',          // 프로필 보강이 필요하면 서비스 레이어에서 채움
      authorParentAvatarMediaId: null, // 프로필 보강이 필요하면 서비스 레이어에서 채움
    };
  }

  async markSolved(params: MarkSolvedParams): Promise<void> {
    const { childProfileId, quizId } = params;

    // Prisma 모델명: Assignment (delegate: prisma.assignment)
    await this.prisma.assignment.upsert({
      where: {
        // @@unique([quizId, childProfileId]) 를 활용한 복합 고유 upsert
        quizId_childProfileId: { quizId, childProfileId },
      },
      update: { isSolved: true },
      create: { quizId, childProfileId, isSolved: true },
    });
  }


}

