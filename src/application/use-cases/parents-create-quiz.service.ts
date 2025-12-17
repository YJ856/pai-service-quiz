// 입력(Command) → 기본 출제일 계산 → 도메인 생성 → 저장(Adapter) → Result DTO 반환
import { Inject, Injectable, BadRequestException } from '@nestjs/common';

// Port-In(인터페이스)는 타입 전용 import
import type { CreateQuizUseCase } from '../port/in/parents-create-quiz.usecase';
import type { ParentsCreateQuizCommand } from '../command/parents-create-quiz.command';
import type { QuizCommandPort } from '../port/out/quiz.repository.port';
import type { QuizQueryPort } from '../port/out/quiz.query.port';
import type { CreateQuizResponseResult } from '../port/in/result/parents-create-quiz-result.dto';
// 도메인/토큰/런타임 클래스는 일반 import
import { Quiz } from '../../domain/model/quiz';
import { PublishDate } from '../../domain/value-object/publish-date';
import { QUIZ_TOKENS } from '../../quiz.token';
import { todayYmdKST, plusOneYmd, isValidYmd } from '../../utils/date.util';
import { CreateQuizMapper } from '../../adapter/in/http/mapper/parents-create-quiz.mapper';

@Injectable()
export class CreateQuizService implements CreateQuizUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizCommandPort)
    private readonly repo: QuizCommandPort,
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly quizQuery: QuizQueryPort,
    private readonly createQuizMapper: CreateQuizMapper,
  ) {}

  async execute(
    command: ParentsCreateQuizCommand,
  ): Promise<CreateQuizResponseResult> {
    // 0) 필수 헤더(부모 프로필) 확인 — Guard/@Auth에서 주입되지만 방어적으로 확인
    if (command.parentProfileId == null) {
      throw new BadRequestException(
        'VALIDATION_ERROR: parentProfileId required',
      );
    }
    const parentProfileId = command.parentProfileId;

    // 1) publishDate 결정(yyyy-MM-dd)
    const publishDate =
      command.publishDate ??
      (await this.nextDefaultDateForFamily(parentProfileId));

    // 2) 입력 검증
    const question = (command.question ?? '').trim();
    const answer = (command.answer ?? '').trim();

    if (!question)
      throw new BadRequestException('VALIDATION_ERROR: question required');
    if (!answer)
      throw new BadRequestException('VALIDATION_ERROR: answer required');
    if (!isValidYmd(publishDate)) {
      throw new BadRequestException(
        'VALIDATION_ERROR: publishDate must be yyyy-MM-dd',
      );
    }

    // 3) 도메인 객체 생성
    const domain = Quiz.create({
      parentProfileId,
      question,
      answer,
      publishDate: PublishDate.ofISO(publishDate),
      hint: command.hint ?? null,
      reward: command.reward ?? null,
    });

    // 4) 저장
    const saved = await this.repo.save(domain);

    // 5) Result DTO로 변환
    return this.createQuizMapper.toResponseResult(saved, parentProfileId);
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

    const today = todayYmdKST();
    const hasToday = await this.quizQuery.existsAnyOnDate(pid, today);
    return hasToday ? plusOneYmd(today) : today;
  }
}
