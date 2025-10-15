import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import type { QuizDeleteRepositoryPort } from '../../../application/port/out/quiz-delete.repository.port';

/**
 * QuizDeleteAdapter - 퀴즈 삭제 전용 어댑터
 * - 단일 책임: 퀴즈 삭제 작업만 담당
 * - 조건부 삭제: SCHEDULED 상태 && 작성자 본인일 때만 삭제
 */
@Injectable()
export class QuizDeleteAdapter implements QuizDeleteRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

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
