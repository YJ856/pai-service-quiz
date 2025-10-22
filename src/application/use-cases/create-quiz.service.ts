// 입력(Command) → 기본 출제일 계산 → 도메인 생성(불변식 검증, SCHEDULED 고정) → 저장(Adapter) → Result DTO 반환
import { Inject, Injectable, BadRequestException } from '@nestjs/common';

// Port-In(인터페이스)는 타입 전용 import
import type { CreateQuizUseCase } from '../port/in/create-quiz.usecase';
import type { CreateQuizCommand } from '../command/create-quiz.command';
import type { QuizCommandPort } from '../port/out/quiz.repository.port';
import type { QuizQueryPort } from '../port/out/quiz.query.port';
import type { CreateQuizResponseResult } from '../port/in/result/create-quiz.result.dto';
// 도메인/토큰/런타임 클래스는 일반 import
import { Quiz } from '../../domain/model/quiz';
import { QUIZ_TOKENS } from '../../quiz.token';
import { todayYmd, plusOneYmd } from '../../utils/date.util';
import { CreateQuizMapper } from '../../mapper/create-quiz.mapper';

@Injectable()
export class CreateQuizService implements CreateQuizUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizCommandPort)
    private readonly repo: QuizCommandPort,
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly quizQuery: QuizQueryPort,
    private readonly createQuizMapper: CreateQuizMapper,
  ) {}

  async execute(cmd: CreateQuizCommand): Promise<CreateQuizResponseResult> {
    // 0) 필수 헤더(부모 프로필) 확인 — Guard/@Auth에서 주입되지만 방어적으로 확인
    if (cmd.parentProfileId == null) {
      // 팀 정책에 맞춰 400/401/403 중 선택
      throw new BadRequestException('VALIDATION_ERROR: parentProfileId required');
    }
    const parentProfileId = cmd.parentProfileId;

    // 1) publishDate 결정(yyyy-MM-dd)
    const publishDate =
      cmd.publishDate ?? (await this.nextDefaultDateForFamily(parentProfileId));

    // 2) 도메인 생성 (SCHEDULED 고정, 불변식 검증)
    const domain = Quiz.create({
      question: cmd.question,
      answer: cmd.answer,
      hint: cmd.hint ?? null,
      reward: cmd.reward ?? null,
      publishDate,
      authorParentProfileId: parentProfileId,
    });

    // 3) 저장
    const saved = await this.repo.save(domain);

    // 4) Result DTO로 변환
    return this.createQuizMapper.toResponseResult(saved);
  }

  /**
   * 기본 출제일 계산 (next-publish-date.service.ts와 동일한 로직)
   * 규칙:
   * 1) 예약(SCHEDULED) 중 가장 마지막 날짜 + 1일
   * 2) 예약이 없으면 → 오늘 존재 여부 확인:
   *    - 오늘이 비어있으면: 오늘
   *    - 오늘 이미 있으면: 내일
   */
  private async nextDefaultDateForFamily(
    parentProfileId: number,
  ): Promise<string> {
    const pid = parentProfileId;

    const last = await this.quizQuery.findLastScheduledDateYmd(pid);
    if (last) return plusOneYmd(last);

    const today = todayYmd();
    const hasToday = await this.quizQuery.existsAnyOnDate(pid, today);
    return hasToday ? plusOneYmd(today) : today;
  }
}
