import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ParentsQuizDetailResponseData } from 'pai-shared-types';

import type {
  GetParentsQuizDetailQuery,
  GetParentsQuizDetailUseCase,
} from '../port/in/get-parents-quiz-detail.usecase';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizQueryPort,
} from '../port/out/quiz.query.port';

// Utils
import { toYmdFromDate } from '../../utils/date.util';

@Injectable()
export class GetParentsQuizDetailService implements GetParentsQuizDetailUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly repo: QuizQueryPort,
  ) {}

  /**
   * 부모용 퀴즈 상세 조회
   * - 권한: 작성자(parentProfileId 일치)만 접근 가능(아니면 403)
   * - 상태: SCHEDULED만 수정 가능(아니면 409 NOT_SCHEDULED)
   * - 성공 시: 상세 데이터 + isEditable 반환
   */
  async execute(query: GetParentsQuizDetailQuery): Promise<ParentsQuizDetailResponseData> {
    const quizId = query.quizId;
    const requesterPid = this.toInt(query.parentProfileId);

    // 1) 단건 조회
    const row = await this.repo.findDetailById(quizId);
    if (!row) throw new NotFoundException('QUIZ_NOT_FOUND');

    // 2) 권한 체크 (출제자 == 요청자)
    if (row.parentProfileId !== requesterPid) {
      throw new ForbiddenException('FORBIDDEN');
    }

    // 3) 상태 체크 (예정만 수정 가능)
    if (row.status !== 'SCHEDULED') {
      throw new ConflictException('NOT_SCHEDULED');
    }

    // 4) 응답 매핑
    return {
      quizId: row.id,
      question: row.question,
      answer: row.answer,
      hint: row.hint ?? undefined,
      reward: row.reward ?? undefined,
      publishDate: toYmdFromDate(row.publishDate), // 'yyyy-MM-dd'
      isEditable: true, // 위에서 SCHEDULED & 본인 확인 통과
    };
  }

  // ============== Helpers ==============

  private toInt(input: string | number): number {
    const n = typeof input === 'string' ? Number(input) : input;
    if (!Number.isFinite(n)) throw new BadRequestException('VALIDATION_ERROR');
    return n;
  }
}
