import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { QUIZ_TOKENS } from '../../quiz.token';
import { isValidYmd, ymdToUtcDate, toYmdFromDate, todayYmd } from '../../utils/date.util';
import { canEdit } from '../../domain/policy/quiz.policy';
import { Quiz } from '../../domain/model/quiz';
import { UpdateQuizMapper } from '../../mapper/parents-update-quiz.mapper';

import type { UpdateQuizCommand } from '../command/parents-update-quiz.command';
import type { UpdateQuizUseCase } from '../port/in/update-quiz.usecase';
import type { QuizQueryPort } from '../port/out/quiz.query.port';
import type {
  QuizCommandPort,
  QuizUpdateRepoPatch,
} from '../port/out/quiz.repository.port';
import type { UpdateQuizResponseResult } from '../port/in/result/update-quiz.result.dto';

@Injectable()
export class UpdateQuizService implements UpdateQuizUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly detailRepo: QuizQueryPort,

    @Inject(QUIZ_TOKENS.QuizCommandPort)
    private readonly updateRepo: QuizCommandPort,

    private readonly updateQuizMapper: UpdateQuizMapper,
  ) {}

  /**
   * 부모용 퀴즈 수정
   * - 작성자 본인만
   * - 상태가 SCHEDULED인 경우에만
   * - 전달된 필드만 부분 수정 (hint/reward === null 이면 제거)
   * - 수정된 퀴즈 Result DTO 반환
   */
  async execute(cmd: UpdateQuizCommand): Promise<UpdateQuizResponseResult> {
    const quizId = cmd.quizId;
    const requesterPid = cmd.parentProfileId; // 이미 bigint

    // 0) 수정 대상 필드가 하나도 없으면 오류
    if (!this.hasAnyPatch(cmd)) {
      throw new BadRequestException('VALIDATION_ERROR');
    }

    // 1) 대상 조회
    const row = await this.detailRepo.findDetailById(quizId);
    if (!row) throw new NotFoundException('QUIZ_NOT_FOUND');

    // 2) 권한 & 상태 체크 (도메인 정책 활용)
    const today = todayYmd();
    const publishDateYmd = toYmdFromDate(row.publishDate);

    if (!canEdit(publishDateYmd, row.parentProfileId, requesterPid, today)) {
      // 작성자가 아니거나 SCHEDULED 상태가 아님
      if (row.parentProfileId !== requesterPid) {
        throw new ForbiddenException('FORBIDDEN');
      }
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
      parentProfileId: requesterPid, // 수정: ParentProfileId -> parentProfileId
      patch: repoPatch,
    });

    if (updated === 0) {
      // 레이스로 status 변경/권한 변경/삭제 등
      throw new ConflictException('NOT_SCHEDULED');
    }

    // 6) 수정된 퀴즈를 다시 조회하여 Quiz 도메인 객체 생성
    const updatedRow = await this.detailRepo.findDetailById(quizId);
    if (!updatedRow) throw new NotFoundException('QUIZ_NOT_FOUND');

    const quiz = new Quiz(
      updatedRow.question,
      updatedRow.answer,
      toYmdFromDate(updatedRow.publishDate),
      updatedRow.parentProfileId,
      updatedRow.hint,
      updatedRow.reward,
      updatedRow.id
    );

    // 7) Result DTO로 변환
    return this.updateQuizMapper.toResponseResult(quiz);
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
