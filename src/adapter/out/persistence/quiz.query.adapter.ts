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

import type {
  QuizChildrenQueryRepositoryPort,
  FindChildrenTodayParams,
  FindChildrenTodayResult,
  FindChildrenCompletedParams,
  FindChildrenCompletedResult,
} from '../../../application/port/out/quiz-children-query.repository.port';


import type {
  QuizDetailQueryRepositoryPort,
  QuizDetailRow,
} from '../../../application/port/out/quiz-detail-query.repository.port';
import { toYmdFromDate, ymdToUtcDate, utcDayRangeForYmd,  } from '../../../utils/date.util';
import { toIntId } from '../../../utils/id.util';

@Injectable()
export class QuizQueryAdapter implements QuizQueryPort, QuizParentsQueryRepositoryPort, QuizDetailQueryRepositoryPort, QuizChildrenQueryRepositoryPort {
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

  async findById(quizId: number): Promise<QuizDetailRow | null> {
    const row = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        question: true,
        answer: true,
        hint: true,
        reward: true,
        publishDate: true,    // @db.Date → Date
        parentProfileId: true,
        status: true,         // 'SCHEDULED' | 'TODAY' | 'COMPLETED'
      },
    });

    if (!row) return null;

    // Prisma 타입을 포트 타입(QuizDetailRow)으로 그대로 매핑
    return {
      id: row.id,
      question: row.question,
      answer: row.answer,
      hint: row.hint ?? null,
      reward: row.reward ?? null,
      publishDate: row.publishDate,
      parentProfileId: row.parentProfileId,
      status: row.status as QuizDetailRow['status'],
    };
  }

    /**
   * 자녀용 오늘의 퀴즈
   * - todayYmd: 'yyyy-MM-dd' (KST 기준) → utcDayRangeForYmd 로 UTC 경계 변환
   * - 정렬: id ASC
   * - 커서: id > afterQuizId
   * - 대상 자녀에게 배정된(assignments.some) TODAY만 조회
   */
  async findChildrenToday(params: FindChildrenTodayParams): Promise<FindChildrenTodayResult> {
    const { childProfileId, todayYmd, limit, afterQuizId } = params;
    const cid = toIntId(childProfileId);
    const { gte, lt } = utcDayRangeForYmd(todayYmd);

    const rows = await this.prisma.quiz.findMany({
      where: {
        status: 'TODAY',
        publishDate: { gte, lt },
        assignments: {
          some: { childProfileId: cid },
        },
        ...(afterQuizId ? { id: { gt: afterQuizId } } : {}),
      },
      orderBy: { id: 'asc' },
      take: limit + 1, // hasNext 판단용
      select: {
        id: true,
        status: true,                   // 'TODAY'
        question: true,
        hint: true,
        reward: true,
        parentProfileId: true,          // authorParentProfileId 로 매핑
        // author 이름/아바타는 외부 user 서비스에서 보강 전 기본값만 내려도 OK
        assignments: {
          where: { childProfileId: cid },
          select: { isSolved: true },
        },
      },
    });

    const hasNext = rows.length > limit;
    const page = hasNext ? rows.slice(0, limit) : rows;

    // ChildrenTodayItemDto 로 매핑
    const items = page.map((q) => ({
      quizId: q.id,
      status: 'TODAY' as const,
      question: q.question,
      hint: q.hint ?? undefined,
      // 보상 노출 정책은 UseCase에서 isSolved 기준으로 필터링 예정이므로 원본 유지
      reward: q.reward ?? undefined,

      authorParentProfileId: q.parentProfileId,
      authorParentName: '부모',            // 서비스에서 실제 프로필 정보 보강 가능
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
    const { childProfileId, limit, after } = params;
    const cid = toIntId(childProfileId);

    // 커서 조건 (부모용 completed와 동일한 규칙)
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
        status: 'COMPLETED',
        assignments: {
          some: {
            childProfileId: cid,
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

    const hasNext = rows.length > limit;
    const page = hasNext ? rows.slice(0, limit) : rows;

    const items = page.map((q) => ({
      quizId: q.id,
      status: 'COMPLETED' as const,
      publishDate: toYmdFromDate(q.publishDate), // 'yyyy-MM-dd' (KST 기준 문자열로 변환 유틸 재사용)
      question: q.question,
      answer: q.answer,
      reward: q.reward ?? undefined,

      authorParentProfileId: q.parentProfileId,
      authorParentName: '부모',             // 필요 시 서비스 레이어에서 실제 이름으로 보강
      authorParentAvatarMediaId: null,      // 필요 시 서비스 레이어에서 보강
    }));

    return { items, hasNext };
  }

}

