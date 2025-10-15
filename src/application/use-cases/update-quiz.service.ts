import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { QUIZ_TOKENS } from '../../quiz.token';
import { isValidYmd, ymdToUtcDate } from '../../utils/date.util';

import type { UpdateQuizCommand } from '../command/update-quiz.command';
import type { UpdateQuizUseCase } from '../port/in/update-quiz.usecase';
import type { QuizDetailQueryRepositoryPort } from '../port/out/quiz-detail-query.repository.port';
import type {
  QuizUpdateRepositoryPort,
  QuizUpdateRepoPatch,
} from '../port/out/quiz-update.repository.port';

@Injectable()
export class UpdateQuizService implements UpdateQuizUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizDetailQueryRepositoryPort)
    private readonly detailRepo: QuizDetailQueryRepositoryPort,

    @Inject(QUIZ_TOKENS.QuizUpdateRepositoryPort)
    private readonly updateRepo: QuizUpdateRepositoryPort,
  ) {}

  /**
   * 부모용 퀴즈 수정
   * - 작성자 본인만
   * - 상태가 SCHEDULED인 경우에만
   * - 전달된 필드만 부분 수정 (hint/reward === null 이면 제거)
   * - 수정된 퀴즈 도메인을 반환
   */
  async execute(cmd: UpdateQuizCommand): Promise<any> {
    const quizId = cmd.quizId;
    const requesterPid = this.toInt(cmd.parentProfileId);

    // 0) 수정 대상 필드가 하나도 없으면 오류
    if (!this.hasAnyPatch(cmd)) {
      throw new BadRequestException('VALIDATION_ERROR');
    }

    // 1) 대상 조회
    const row = await this.detailRepo.findById(quizId);
    if (!row) throw new NotFoundException('QUIZ_NOT_FOUND');

    // 2) 권한 & 상태 체크
    if (row.parentProfileId !== requesterPid) {
      throw new ForbiddenException('FORBIDDEN');
    }
    if (row.status !== 'SCHEDULED') {
      throw new ConflictException('NOT_SCHEDULED');
    }

    // 3) publishDate 정규화(옵션)
    let publishDate: Date | undefined = undefined;
    if (cmd.publishDate !== undefined) {
      const ymd = String(cmd.publishDate).trim();
      if (!isValidYmd(ymd)) {
        throw new BadRequestException('VALIDATION_ERROR');
      }
      publishDate = ymdToUtcDate(ymd); // Prisma @db.Date 비교/저장용
    }

    // 4) Repo patch 구성(전달된 필드만)
    const repoPatch: QuizUpdateRepoPatch = {
      question: cmd.question !== undefined ? String(cmd.question) : undefined,
      answer: cmd.answer !== undefined ? String(cmd.answer) : undefined,
      hint:
        cmd.hint === null
          ? null
          : cmd.hint !== undefined
          ? String(cmd.hint)
          : undefined,
      reward:
        cmd.reward === null
          ? null
          : cmd.reward !== undefined
          ? String(cmd.reward)
          : undefined,
      publishDate, // undefined면 변경 없음
    };

    // 5) DB에서 최종 조건(작성자+SCHEDULED)까지 보장하며 수정 시도
    const updated = await this.updateRepo.updateIfScheduledAndAuthor({
      quizId,
      ParentProfileId: requesterPid,
      patch: repoPatch,
    });

    if (updated === 0) {
      // 레이스로 status 변경/권한 변경/삭제 등
      throw new ConflictException('NOT_SCHEDULED');
    }

    // 6) 수정된 퀴즈를 다시 조회하여 반환
    const updatedQuiz = await this.detailRepo.findById(quizId);
    if (!updatedQuiz) throw new NotFoundException('QUIZ_NOT_FOUND');

    return updatedQuiz;
  }

  // ===== helpers =====
  private toInt(n: number | string): number {
    const v = typeof n === 'string' ? Number(n) : n;
    if (!Number.isFinite(v) || v <= 0) throw new BadRequestException('VALIDATION_ERROR');
    return v;
  }

  private hasAnyPatch(cmd: UpdateQuizCommand): boolean {
    return (
      cmd.question !== undefined ||
      cmd.answer !== undefined ||
      cmd.hint !== undefined ||
      cmd.reward !== undefined ||
      cmd.publishDate !== undefined
    );
  }
}
