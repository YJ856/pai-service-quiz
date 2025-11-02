import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AnswerQuizResponseResult } from 'src/application/port/in/result/children-answer-quiz-result.dto';

import type { AnswerQuizUseCase } from '../port/in/children-answer-quiz.usecase';
import { ChildrenAnswerQuizCommand } from '../command/children-answer-quiz.command';

import { QUIZ_TOKENS } from '../../quiz.token';
import type { QuizQueryPort, } from '../port/out/quiz.query.port';
import type { QuizCommandPort, } from '../port/out/quiz.repository.port';
import type { ProfileDirectoryPort } from '../port/out/profile-directory.port';

// Utils
import { todayYmdKST } from '../../utils/date.util';

@Injectable()
export class AnswerQuizService implements AnswerQuizUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly queryRepo: QuizQueryPort,

    @Inject(QUIZ_TOKENS.QuizCommandPort)
    private readonly commandRepo: QuizCommandPort,

    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  /**
   * 아이 정답 제출
   * - 형식: 주관식
   * - 무제한 시도 가능(오답이면 DB 변화 없음)
   * - 해당 날짜(Asia/Seoul)가 지나면 제출 불가
   * - 채점: 기본 완전 일치, normalize=true 시 간단 정규화 후 비교
   */
  async execute(command: ChildrenAnswerQuizCommand): Promise<AnswerQuizResponseResult> {
    const { childProfileId, quizId } = command;

    // quizId 검증 (null 체크)
    if (!quizId || quizId <= 0n) {
      throw new BadRequestException('VALIDATION_ERROR: invalid quizId');
    }

    // 답안 검증: 빈 문자열 불허
    const trimmedAnswer = (command.answer ?? '').trim();
    if (!trimmedAnswer) {
      throw new BadRequestException('VALIDATION_ERROR: answer cannot be empty');
    }

    const todayYmd = todayYmdKST();

    // 1) 가족 부모 프로필 조회
    const { parents } = await this.profiles.getFamilyProfileWithScopeParents();
    const familyParentIds = (parents ?? []).map(parent => parent.profileId);

    if (familyParentIds.length === 0) {
      throw new NotFoundException('NO_PARENTS_FOUND');
    }

    // 2) 오늘의 퀴즈 중에서 해당 quizId 찾기 (오늘 날짜 + 가족 부모 검증)
    const { items: todayQuizzes } = await this.queryRepo.findFamilyParentsToday({
      parentProfileIds: familyParentIds,
      dateYmd: todayYmd,
      limit: 100, // 충분히 큰 수
    });

    const targetQuiz = todayQuizzes.find(quiz => quiz.quizId === quizId);
    if (!targetQuiz) {
      throw new NotFoundException('QUIZ_NOT_FOUND_OR_NOT_TODAY');
    }

    // 3) 이미 풀었는지 확인
    const assignments = await this.queryRepo.findAssignmentsForQuizzes({
      quizIds: [quizId],
      childProfileIds: [childProfileId],
    });
    const alreadySolved = assignments.some(assignment => assignment.quizId === quizId && assignment.isSolved);

    // 4) 채점 (정규화 후 비교: 대소문자 무시, 공백/기호 제거)
    const isCorrect = this.checkAnswer(trimmedAnswer, targetQuiz.answer, true);

    // 5) 저장 (정답이면서 아직 미해결인 경우에만)
    if (isCorrect && !alreadySolved) {
      await this.commandRepo.markSolved({
        childProfileId,
        quizId,
      });
    }

    // 6) 응답
    const response: AnswerQuizResponseResult = {
      quizId,
      isSolved: isCorrect,
    };

    // 정답인 경우에만 reward 포함
    if (isCorrect && targetQuiz.reward) {
      response.reward = targetQuiz.reward;
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
