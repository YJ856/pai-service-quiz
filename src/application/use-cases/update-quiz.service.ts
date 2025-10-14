import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UpdateQuizRequestDto } from 'pai-shared-types';

import { QUIZ_TOKENS } from '../../quiz.token';

import type { UpdateQuizCommand, UpdateQuizUseCase } from '../port/in/update-quiz.usecase';
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
   */
  async execute(cmd: UpdateQuizCommand): Promise<void> {
    const quizId = this.toInt(cmd.quizId);
    const requesterPid = this.toInt(cmd.parentProfileId);
    const patchDto = cmd.patch ?? {};

    // 0) 수정 대상 필드가 하나도 없으면 오류
    if (!this.hasAnyPatch(patchDto)) {
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
    if (patchDto.publishDate !== undefined) {
      const ymd = String(patchDto.publishDate).trim();
      if (!this.isValidYmd(ymd)) {
        throw new BadRequestException('VALIDATION_ERROR');
      }
      publishDate = this.ymdToUtcDate(ymd); // Prisma @db.Date 비교/저장용
    }

    // 4) Repo patch 구성(전달된 필드만)
    const repoPatch: QuizUpdateRepoPatch = {
      question: patchDto.question !== undefined ? String(patchDto.question) : undefined,
      answer: patchDto.answer !== undefined ? String(patchDto.answer) : undefined,
      hint:
        patchDto.hint === null
          ? null
          : patchDto.hint !== undefined
          ? String(patchDto.hint)
          : undefined,
      reward:
        patchDto.reward === null
          ? null
          : patchDto.reward !== undefined
          ? String(patchDto.reward)
          : undefined,
      publishDate, // undefined면 변경 없음
    };

    // 5) DB에서 최종 조건(작성자+SCHEDULED)까지 보장하며 수정 시도
    const updated = await this.updateRepo.updateIfScheduledAndAuthor({
      quizId,
      authorParentProfileId: requesterPid,
      patch: repoPatch,
    });

    if (updated === 0) {
      // 레이스로 status 변경/권한 변경/삭제 등
      throw new ConflictException('NOT_SCHEDULED');
    }
    // 성공: 반환 바디 없음(컨트롤러에서 메시지 래핑)
  }

  // ===== helpers =====
  private toInt(n: number | string): number {
    const v = typeof n === 'string' ? Number(n) : n;
    if (!Number.isFinite(v) || v <= 0) throw new BadRequestException('VALIDATION_ERROR');
    return v;
  }

  private hasAnyPatch(p: UpdateQuizRequestDto): boolean {
    return (
      'question' in p ||
      'answer' in p ||
      'hint' in p ||
      'reward' in p ||
      'publishDate' in p
    );
  }

  /** yyyy-MM-dd 형식 검증 (간단 정규식) */
  private isValidYmd(s: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const [y, m, d] = s.split('-').map(Number);
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    // 유효 날짜 체크
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === m - 1 &&
      dt.getUTCDate() === d
    );
  }

  /** 'yyyy-MM-dd' → UTC 00:00 Date (@db.Date용) */
  private ymdToUtcDate(ymd: string): Date {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  }
}
