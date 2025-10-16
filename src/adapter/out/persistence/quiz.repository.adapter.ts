import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Quiz } from '../../../domain/model/quiz';
import type { QuizRepositoryPort } from '../../../application/port/out/quiz.repository.port';
import type {
  QuizUpdateRepositoryPort,
  QuizUpdateRepoPatch,
} from '../../../application/port/out/quiz-update.repository.port';
import type { QuizDeleteRepositoryPort } from '../../../application/port/out/quiz-delete.repository.port';
import { ymdToUtcDate, utcDateToYmd } from '../../../utils/date.util';

@Injectable()
export class QuizRepositoryAdapter
  implements QuizRepositoryPort, QuizUpdateRepositoryPort, QuizDeleteRepositoryPort
{
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

  /**
   * 작성자 + SCHEDULED 조건을 만족할 때만 부분 수정
   * - where: id, parentProfileId, status='SCHEDULED'
   * - data: 전달된 필드만 갱신(undefined 는 무시, null 은 DB null)
   * - return: 실제 갱신된 행 수(0 | 1)
   */
  async updateIfScheduledAndAuthor(params: {
    quizId: number;
    ParentProfileId: number;
    patch: QuizUpdateRepoPatch;
  }): Promise<number> {
    const { quizId, ParentProfileId, patch } = params;

    // Prisma updateMany의 data: undefined는 "변경 없음", null은 "null로 세팅"
    const data: Record<string, any> = {};
    if (patch.question !== undefined) data.question = patch.question;
    if (patch.answer !== undefined) data.answer = patch.answer;
    if (patch.hint !== undefined) data.hint = patch.hint;               // string | null
    if (patch.reward !== undefined) data.reward = patch.reward;         // string | null
    if (patch.publishDate !== undefined) data.publishDate = patch.publishDate; // Date

    // 변경할 게 없으면 굳이 쿼리 안 보냄
    if (Object.keys(data).length === 0) return 0;

    const result = await this.prisma.quiz.updateMany({
      where: { id: quizId, parentProfileId: ParentProfileId, status: 'SCHEDULED' },
      data,
    });

    return result.count;
  }

  /**
   * 하드 삭제(완전 삭제).
   * 작성자(parentProfileId) & 상태 SCHEDULED 조건이 모두 만족할 때만 삭제한다.
   * @returns 영향 받은 행 수(0 또는 1)
   */
  async deleteIfScheduledAndAuthor(params: {
    quizId: number;
    parentProfileId: number;
  }): Promise<number> {
    const { quizId, parentProfileId } = params;

    const result = await this.prisma.quiz.deleteMany({
      where: {
        id: quizId,
        parentProfileId,
        status: 'SCHEDULED',
      },
    });

    return result.count ?? 0;
  }
}
