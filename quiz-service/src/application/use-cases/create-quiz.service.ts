// 입력(Command) → 기본 출제일 계산 → 도메인 생성(불변식 검증, SCHEDULED 고정) → 저장(Adapter) → 도메인 반환
import { Inject, Injectable, BadRequestException } from '@nestjs/common';

// Port-In(인터페이스)는 타입 전용 import
import type { CreateQuizUseCase } from '../port/in/create-quiz.usecase';
import type { CreateQuizCommand } from '../command/create-quiz.command';
import type { QuizRepositoryPort } from '../port/out/quiz.repository.port';
// 도메인/토큰/런타임 클래스는 일반 import
import { Quiz } from '../../domain/model/quiz';
import { QUIZ_TOKENS } from '../../quiz.token';

@Injectable()
export class CreateQuizService implements CreateQuizUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizRepositoryPort)
    private readonly repo: QuizRepositoryPort,
  ) {}

  async execute(cmd: CreateQuizCommand): Promise<Quiz> {
    // 0) 필수 헤더(부모 프로필) 확인 — Guard/@Auth에서 주입되지만 방어적으로 확인
    if (cmd.authorParentProfileId == null || cmd.authorParentProfileId === '') {
      // 팀 정책에 맞춰 400/401/403 중 선택
      throw new BadRequestException('VALIDATION_ERROR: authorParentProfileId required');
    }
    const parentProfileId = cmd.authorParentProfileId;

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
    return this.repo.save(domain);
  }

  /** 기본 출제일: 마지막 예약일이 있으면 +1, 없으면 today */
  private async nextDefaultDateForFamily(
    parentProfileId: number | string,
  ): Promise<string> {
    const last = await this.repo.findLastScheduledDateByFamily(parentProfileId);
    return last ? plusOneYmd(last) : todayYmd();
  }
}

/* ========= 날짜 헬퍼(문자열 yyyy-MM-dd 기준) ========= */

/** BUSINESS_TZ(기본 Asia/Seoul) 기준 '오늘'을 yyyy-MM-dd로 */
function todayYmd(): string {
  const tz = process.env.BUSINESS_TZ || 'Asia/Seoul';
  // Intl로 타임존 기준 연-월-일을 안전하게 추출
  const fmt = new Intl.DateTimeFormat('en-CA', { // en-CA => YYYY-MM-DD 형식
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // @ts-ignore: en-CA는 'YYYY-MM-DD'로 반환
  return fmt.format(new Date()); // 예: "2025-10-12"
}

/** yyyy-MM-dd +1일 → yyyy-MM-dd */
function plusOneYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
