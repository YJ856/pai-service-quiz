import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ParentsQuizDetailResponseResult } from 'src/application/port/in/result/parents-detail-quiz-result.dto';

import type { GetParentsQuizDetailUseCase } from '../port/in/parents-detail-quiz.usecase';
import { ParentsDetailQuizCommand } from '../command/parents-detail-quiz.command';
import { DetailQuizMapper } from '../../adapter/in/http/mapper/parents-detail-quiz.mapper';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizQueryPort,
} from '../port/out/quiz.query.port';

// Domain
import { Quiz } from '../../domain/model/quiz';

// Utils
import { toYmdFromDate, todayYmdKST } from '../../utils/date.util';

const canEdit = (
  publishDateYmd: string,
  authorParentProfileId: number,
  requesterParentProfileId: number,
  today: string
): boolean => {
  // 작성자만 접근 가능
  if (authorParentProfileId !== requesterParentProfileId) {
    return false;
  }
  // publishDate가 오늘 이후인 경우만 수정 가능 (SCHEDULED 상태)
  if (publishDateYmd > today) {
    return true;
  }
  return false;
};

@Injectable()
export class GetParentsQuizDetailService implements GetParentsQuizDetailUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly repo: QuizQueryPort,
    private readonly detailQuizMapper: DetailQuizMapper,
  ) {}

  /**
   * 부모용 퀴즈 상세 조회
   * - 권한: 작성자(parentProfileId 일치)만 접근 가능(아니면 403)
   * - 상태: SCHEDULED만 수정 가능(아니면 409 NOT_SCHEDULED)
   * - 성공 시: 상세 데이터 + isEditable 반환
   */
  async execute(cmd: ParentsDetailQuizCommand): Promise<ParentsQuizDetailResponseResult> {
    const quizId = cmd.quizId;
    const requesterPid = cmd.parentProfileId; // 이미 bigint

    // 1) 단건 조회
    const row = await this.repo.findDetailById(quizId);
    if (!row) throw new NotFoundException('QUIZ_NOT_FOUND');

    // 2) 권한 & 상태 체크 (도메인 정책 활용)
    const today = todayYmdKST();
    const publishDateYmd = toYmdFromDate(row.publishDate);

    if (!canEdit(publishDateYmd, row.parentProfileId, requesterPid, today)) {
      // 작성자가 아니거나 SCHEDULED 상태가 아님
      if (row.parentProfileId !== requesterPid) {
        throw new ForbiddenException('FORBIDDEN');
      }
      throw new ConflictException('NOT_SCHEDULED');
    }

    // 3) Quiz 도메인 객체 복원
    const quiz = Quiz.rehydrate({
      id: row.id,
      parentProfileId: row.parentProfileId,
      question: row.question,
      answer: row.answer,
      publishDate: publishDateYmd,
      hint: row.hint,
      reward: row.reward,
    });

    // 4) Mapper를 통해 Result DTO 변환
    return this.detailQuizMapper.toResponseResult(quiz, requesterPid);
  }
}
