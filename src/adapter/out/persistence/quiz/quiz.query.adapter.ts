import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  QuizQueryPort,
  FindParentsTodayParams,
  FindParentsTodayResult,
  FindFamilyParentsCompletedParams,
  FindFamilyParentsCompletedResult,
  FamilyParentsCompletedRow,
  FindParentsScheduledParams,
  FindParentsScheduledResult,
  FindChildrenTodayParams,
  FindChildrenTodayResult,
  FindChildrenCompletedParams,
  FindChildrenCompletedResult,
  FindAnswerTargetParams,
  AnswerTargetRow,
  QuizDetailRow
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
    const { gte, lt } = utcDayRangeForYmd(ymd);
    const count = await this.prisma.quiz.count({
      where: {
        parentProfileId,                       // ✅ 필드명
        publishDate: { gte, lt },              // ✅ 날짜 범위
      },
    });
    return count > 0;
  }

  async findParentsToday(params: FindParentsTodayParams): Promise<FindParentsTodayResult> {
    const { parentProfileId, todayYmd, limit, afterQuizId } = params;
    const { gte, lt } = utcDayRangeForYmd(todayYmd);

    // TODAY = publishDate = today(KST)
    const resultRecords = await this.prisma.quiz.findMany({
      where: {
        parentProfileId,
        publishDate: { gte, lt },      // publishDate = today (UTC 범위로 변환)
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
        parentProfileId: true,
        assignments: {
          select: {
            childProfileId: true,
            isSolved: true,
          },
        },
      },
    });

    const hasNext = resultRecords.length > limit;
    const page = hasNext ? resultRecords.slice(0, limit) : resultRecords;

    const items = page.map((q) => ({
      quizId: q.id,
      question: q.question,
      hint: q.hint ?? null,
      answer: q.answer,
      reward: q.reward ?? null,
      authorParentProfileId: q.parentProfileId,
      authorParentName: '',
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

  // 가족(다수 부모)의 오늘 이전(완료된) 퀴즈 페이지 조회(DESC)
  async findFamilyParentsCompleted(params: FindFamilyParentsCompletedParams): Promise<FindFamilyParentsCompletedResult> {
    const { parentProfileIds, beforeDateYmd, paginationCursor, limit } = params;

    if (!parentProfileIds?.length) { return { items: [], hasNext: false}; }

    const publishDateCutoffUtcExclusive  = ymdToUtcDate(beforeDateYmd);

    const cursorWhere  = paginationCursor
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

    const items: FamilyParentsCompletedRow[] = page.map((record) => ({
      quizId: record.id as unknown as bigint,
      publishDateYmd: record.publishDate.toISOString().slice(0, 10),
      question: record.question,
      answer: record.answer,
      reward: record.reward ?? null,
      authorParentProfileId: record.parentProfileId,
    }));

    return { items, hasNext };
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



  async findParentsScheduled(params: FindParentsScheduledParams): Promise<FindParentsScheduledResult> {
    const { parentProfileId, limit, paginationCursor } = params;
    const today = todayYmdKST();

    // 커서 조건 (정렬: publishDate ASC, id ASC)
    //  - (publishDate > D) OR (publishDate == D AND id > Q)
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

    // SCHEDULED = publishDate > today(KST)
    const resultRecords = await this.prisma.quiz.findMany({
      where: {
        parentProfileId,
        publishDate: { gt: ymdToUtcDate(today) },  // publishDate > today
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

    const hasNext = resultRecords.length > limit;
    const page = hasNext ? resultRecords.slice(0, limit) : resultRecords;

    const items = page.map((q) => ({
      quizId: q.id,
      publishDate: toYmdFromDate(q.publishDate), // 'yyyy-MM-dd'
      question: q.question,
      answer: q.answer,
      hint: q.hint ?? null,
      reward: q.reward ?? null,

      authorParentProfileId: q.parentProfileId,
      authorParentName: '',                // 서비스에서 실제 프로필 정보로 보강
      authorParentAvatarMediaId: null,        // 서비스에서 보강
      isEditable: false,                       // 서비스에서 최종 계산(본인+SCHEDULED)으로 덮어씀
    }));

    return { items, hasNext };
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

    /**
   * 자녀용 오늘의 퀴즈
   * - todayYmd: 'yyyy-MM-dd' (KST 기준) → utcDayRangeForYmd 로 UTC 경계 변환
   * - 정렬: id ASC
   * - 커서: id > paginationCursorQuizId
   * - 대상 자녀에게 배정된(assignments.some) TODAY만 조회
   */
  async findChildrenToday(params: FindChildrenTodayParams): Promise<FindChildrenTodayResult> {
    const { childProfileId, todayYmd, limit, afterQuizId } = params;
    const { gte, lt } = utcDayRangeForYmd(todayYmd);

    // TODAY = publishDate = today(KST)
    const resultRecords = await this.prisma.quiz.findMany({
      where: {
        publishDate: { gte, lt },  // publishDate = today
        assignments: {
          some: { childProfileId },
        },
        ...(afterQuizId ? { id: { gt: afterQuizId } } : {}),
      },
      orderBy: { id: 'asc' },
      take: limit + 1, // hasNext 판단용
      select: {
        id: true,
        question: true,
        hint: true,
        reward: true,
        parentProfileId: true,          // authorParentProfileId 로 매핑
        assignments: {
          where: { childProfileId },
          select: { isSolved: true },
        },
      },
    });

    const hasNext = resultRecords.length > limit;
    const page = hasNext ? resultRecords.slice(0, limit) : resultRecords;

    // ChildrenTodayItemDto 로 매핑
    const items = page.map((q) => ({
      quizId: q.id,
      question: q.question,
      hint: q.hint ?? null,
      // 보상 노출 정책은 UseCase에서 isSolved 기준으로 필터링 예정이므로 원본 유지
      reward: q.reward ?? null,

      authorParentProfileId: q.parentProfileId,
      authorParentName: '',            // 서비스에서 실제 프로필 정보 보강 가능
      authorParentAvatarMediaId: null,    // 서비스에서 보강 가능

      isSolved: !!q.assignments[0]?.isSolved,
    }));

    return { items, hasNext };
  }

    /**
   * 자녀용 완료된 퀴즈
   * - 정렬: publishDate DESC, id DESC
   * - 커서: (publishDate < D) OR (publishDate == D AND id < Q)
   * - 결과: 해당 자녀가 '푼'(isSolved=true) 퀴즈만
   */
  async findChildrenCompleted(params: FindChildrenCompletedParams): Promise<FindChildrenCompletedResult> {
    const { childProfileId, limit, paginationCursor } = params;
    const today = todayYmdKST();

    // 커서 조건 (부모용 completed와 동일한 규칙)
    //  - (publishDate < D) OR (publishDate == D AND id < Q)
    const cursorWhere = paginationCursor
      ? {
          OR: [
            { publishDate: { lt: ymdToUtcDate(paginationCursor.publishDateYmd) } },
            {
              AND: [
                { publishDate: ymdToUtcDate(paginationCursor.publishDateYmd) },
                { id: { lt: paginationCursor.quizId } },
              ],
            },
          ],
        }
      : {};

    // COMPLETED = publishDate < today(KST)
    const resultRecords = await this.prisma.quiz.findMany({
      where: {
        publishDate: { lt: ymdToUtcDate(today) },  // publishDate < today
        assignments: {
          some: {
            childProfileId,
            isSolved: true, // ✅ 본인이 푼 것만
          },
        },
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
      },
    });

    const hasNext = resultRecords.length > limit;
    const page = hasNext ? resultRecords.slice(0, limit) : resultRecords;

    const items = page.map((q) => ({
      quizId: q.id,
      publishDate: toYmdFromDate(q.publishDate), // 'yyyy-MM-dd' (KST 기준 문자열로 변환 유틸 재사용)
      question: q.question,
      answer: q.answer,
      reward: q.reward ?? null,

      authorParentProfileId: q.parentProfileId,
      authorParentName: '',             // 필요 시 서비스 레이어에서 실제 이름으로 보강
      authorParentAvatarMediaId: null,      // 필요 시 서비스 레이어에서 보강
    }));

    return { items, hasNext };
  }

  async findAnswerTarget(params: FindAnswerTargetParams): Promise<AnswerTargetRow | null> {
    const { childProfileId, quizId, todayYmd } = params;
    const { gte, lt } = utcDayRangeForYmd(todayYmd);

    // TODAY = publishDate = today(KST)
    const resultRecords = await this.prisma.quiz.findFirst({
      where: {
        id: quizId,
        publishDate: { gte, lt }, // publishDate = today
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

