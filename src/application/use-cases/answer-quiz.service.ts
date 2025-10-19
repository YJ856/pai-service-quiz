import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AnswerQuizResponseData } from 'pai-shared-types';

import type {
  AnswerQuizUseCase,
  AnswerQuizCommand,
} from '../port/in/answer-quiz.usecase';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizQueryPort,
} from '../port/out/quiz.query.port';
import type {
  QuizCommandPort,
} from '../port/out/quiz.repository.port';

// Utils
import { getTodayYmdKST } from '../../utils/date.util';

@Injectable()
export class AnswerQuizService implements AnswerQuizUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly queryRepo: QuizQueryPort,
    @Inject(QUIZ_TOKENS.QuizCommandPort)
    private readonly commandRepo: QuizCommandPort,
  ) {}

  /**
   * 아이 정답 제출
   * - 형식: 주관식
   * - 무제한 시도 가능(오답이면 DB 변화 없음)
   * - 해당 날짜(Asia/Seoul)가 지나면 제출 불가
   * - 채점: 기본 완전 일치, normalize=true 시 간단 정규화 후 비교
   */
  async execute(cmd: AnswerQuizCommand): Promise<AnswerQuizResponseData> {
    const { childProfileId } = cmd;

    if (!cmd.quizId || !Number.isFinite(cmd.quizId) || cmd.quizId <= 0) {
      throw new BadRequestException('VALIDATION_ERROR: invalid quizId');
    }

    // 답안 검증: 빈 문자열 불허
    const trimmedAnswer = (cmd.answer ?? '').trim();
    if (!trimmedAnswer) {
      throw new BadRequestException('VALIDATION_ERROR: answer cannot be empty');
    }

    const todayYmd = getTodayYmdKST();

    // 1) 제출 대상 조회 (본인 배정 + publishDate = today)
    const target = await this.queryRepo.findAnswerTarget({
      childProfileId,
      quizId: cmd.quizId,
      todayYmd,
    });
    if (!target) {
      // 배정되지 않았거나 존재하지 않는 퀴즈 또는 오늘이 아님
      throw new NotFoundException('QUIZ_NOT_ASSIGNED_OR_NOT_FOUND');
    }

    // 2) 오늘만 풀 수 있음: publishDate == today (쿼리에서 이미 필터링됨)
    // findAnswerTarget이 publishDate = today 조건으로 조회하므로
    // target이 있다면 이미 오늘 퀴즈임이 보장됨
    if (target.publishDateYmd !== todayYmd) {
      // 요구사항: 해당 날짜가 지나면 더 이상 풀 수 없음
      throw new ForbiddenException('QUIZ_DATE_EXPIRED');
    }

    // 3) 채점 (trim된 답안 사용)
    const isCorrect = this.checkAnswer(trimmedAnswer, target.answer, !!cmd.normalize);

    // 4) 저장 (정답이면서 아직 미해결인 경우에만)
    if (isCorrect && !target.isSolved) {
      await this.commandRepo.markSolved({
        childProfileId,
        quizId: cmd.quizId,
      });
    }

    // 5) 응답 - 단순화
    // - 정답: isSolved=true, reward 반환
    // - 오답: isSolved=false, reward 없음
    const response: AnswerQuizResponseData = {
      quizId: cmd.quizId,
      isSolved: isCorrect,
    };

    // 정답인 경우에만 reward 포함
    if (isCorrect && target.reward) {
      response.reward = target.reward;
    }

    return response;
  }

  // ===== Helpers =====

  /** 채점: 기본 완전 일치, normalize=true면 간단 정규화 후 비교 */
  private checkAnswer(input: string, correct: string, normalize: boolean): boolean {
    if (!normalize) {
      return input === correct;
    }
    const n1 = this.normalizeAnswer(input);
    const n2 = this.normalizeAnswer(correct);
    return n1 === n2;
  }

  /**
   * 간단 정규화
   * - Unicode NFKC
   * - lowercasing
   * - trim
   * - 공백/기호 제거: \p{Separator}, \p{Punctuation}, \p{Symbol}
   *   (문자/숫자 중심 비교; 한글/라틴/숫자 보존)
   */
  private normalizeAnswer(s: string): string {
    let x = (s ?? '').normalize('NFKC').toLowerCase().trim();
    // 모든 공백 제거
    x = x.replace(/\s+/gu, '');
    // 구두점/기호 제거
    x = x.replace(/[\p{P}\p{S}]/gu, '');
    return x;
  }
}
