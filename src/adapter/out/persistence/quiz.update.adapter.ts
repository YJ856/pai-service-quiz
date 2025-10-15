import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import type {
  QuizUpdateRepositoryPort,
  QuizUpdateRepoPatch,
} from '../../../application/port/out/quiz-update.repository.port';

@Injectable()
export class QuizUpdateAdapter implements QuizUpdateRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

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

    // Prisma updateMany의 data: undefined는 “변경 없음”, null은 “null로 세팅”
    const data: Record<string, any> = {};
    if (patch.question !== undefined) data.question = patch.question;
    if (patch.answer !== undefined) data.answer = patch.answer;
    if (patch.hint !== undefined) data.hint = patch.hint;               // string | null
    if (patch.reward !== undefined) data.reward = patch.reward;         // string | null
    if (patch.publishDate !== undefined) data.publishDate = patch.publishDate; // Date

    // 변경할 게 없으면 굳이 쿼리 안 보냄 (상위 서비스에서 이미 검증하지만 이중 안전)
    if (Object.keys(data).length === 0) return 0;

    const result = await this.prisma.quiz.updateMany({
      where: { id: quizId, parentProfileId: ParentProfileId, status: 'SCHEDULED' },
      data,
    });

    return result.count;
  }
}
