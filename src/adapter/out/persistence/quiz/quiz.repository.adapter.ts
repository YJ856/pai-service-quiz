import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Quiz } from '../../../../domain/model/quiz';
import { QuizMapper } from './quiz.mapper';
import type {
  QuizCommandPort,
  QuizUpdateRepoPatch,
  MarkSolvedParams,
} from '../../../../application/port/out/quiz.repository.port';
import { ymdToUtcDate, utcDateToYmd, todayYmdKST } from '../../../../utils/date.util';

@Injectable()
export class QuizRepositoryAdapter implements QuizCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  /** 신규 퀴즈 저장: 도메인(문자열 날짜) → Prisma(Date) */
  async save(quiz: Quiz): Promise<Quiz> {
    const persistenceData = QuizMapper.toPersistenceData(quiz);
    const createdQuizRow = await this.prisma.quiz.create({
      data: persistenceData,
    });

    // Prisma Row → 도메인
    return QuizMapper.toDomain(createdQuizRow);
  }


  /** 가족의 마지막 예약일(yyyy-MM-dd) */
  async findLastScheduledDateByFamily(parentProfileId: number): Promise<string | null> {
    const todayYmd = todayYmdKST();
    // SCHEDULED = publishDate > today(KST)
    const quizRow = await this.prisma.quiz.findFirst({
      where: {
        parentProfileId,
        publishDate: { gt: ymdToUtcDate(todayYmd) }  // publishDate > today
      },
      orderBy: { publishDate: 'desc' },
      select: { publishDate: true },
    });
    return quizRow ? utcDateToYmd(quizRow.publishDate) : null;
  }

  /** (선택) 상세 조회 */
  async findById(id: bigint): Promise<Quiz | null> {
    const quizRow = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quizRow) return null;
    return QuizMapper.toDomain(quizRow);
  }

  /**
   * 작성자 + SCHEDULED 조건을 만족할 때만 부분 수정
   * - where: id, parentProfileId, publishDate > today(KST)
   * - data: 전달된 필드만 갱신(undefined 는 무시, null 은 DB null)
   * - return: 실제 갱신된 행 수(0 | 1)
   */
  async updateIfScheduledAndAuthor(params: {
    quizId: bigint;
    parentProfileId: number;
    patch: QuizUpdateRepoPatch;
  }): Promise<number> {
    const { quizId, parentProfileId, patch } = params;
    const todayYmd = todayYmdKST();

    // Prisma updateMany의 data: undefined는 "변경 없음", null은 "null로 세팅"
    const updateData: Record<string, any> = {};
    if (patch.question !== undefined) updateData.question = patch.question;
    if (patch.answer !== undefined) updateData.answer = patch.answer;
    if (patch.hint !== undefined) updateData.hint = patch.hint;               // string | null
    if (patch.reward !== undefined) updateData.reward = patch.reward;         // string | null
    if (patch.publishDate !== undefined) updateData.publishDate = patch.publishDate; // Date

    // 변경할 게 없으면 굳이 쿼리 안 보냄
    if (Object.keys(updateData).length === 0) return 0;

    // SCHEDULED = publishDate > today(KST)
    const updateResult = await this.prisma.quiz.updateMany({
      where: {
        id: quizId,
        parentProfileId,
        publishDate: { gt: ymdToUtcDate(todayYmd) }  // publishDate > today
      },
      data: updateData,
    });

    return updateResult.count;
  }

  /**
   * 하드 삭제(완전 삭제).
   * 작성자(parentProfileId) & 상태 SCHEDULED 조건이 모두 만족할 때만 삭제한다.
   * @returns 영향 받은 행 수(0 또는 1)
   */
  async deleteIfScheduledAndAuthor(params: {
    quizId: bigint;
    parentProfileId: number;
  }): Promise<number> {
    const { quizId, parentProfileId } = params;
    const todayYmd = todayYmdKST();

    // SCHEDULED = publishDate > today(KST)
    const deleteResult = await this.prisma.quiz.deleteMany({
      where: {
        id: quizId,
        parentProfileId,
        publishDate: { gt: ymdToUtcDate(todayYmd) }  // publishDate > today
      },
    });

    return deleteResult.count ?? 0;
  }

  /**
   * 정답 처리: 해당 자녀-퀴즈 assignment에 isSolved=true 저장
   * - 이미 isSolved=true면 멱등 처리(에러 없이 그대로 유지)
   */
  async markSolved(params: MarkSolvedParams): Promise<void> {
    const { childProfileId, quizId } = params;

    await this.prisma.assignment.upsert({
      where: {
        quizId_childProfileId: {
          quizId,
          childProfileId
        },
      },
      update: { isSolved: true },
      create: {
        quizId,
        childProfileId,
        isSolved: true
      },
    });
  }
}
