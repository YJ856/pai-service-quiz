import { Inject, Injectable } from '@nestjs/common';
import type {
  ChildrenTodayResponseResult,
  ChildrenTodayItemDto,
} from '../port/in/result/children-today-quiz-result.dto';

import type { ListChildrenTodayUseCase } from '../port/in/children-today-quiz.usecase';
import type { ChildrenTodayQuizCommand } from '../command/children-today-quiz.command';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizQueryPort,
} from '../port/out/quiz.query.port';

import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
} from '../port/out/profile-directory.port';

// Utils
import { todayYmdKST } from '../../utils/date.util';
import { decodeIdCursor, encodeIdCursor } from '../../utils/cursor.util';
import {
  getParentProfilesSafe,
  collectParentProfileIds,
} from '../../utils/profile.util';

@Injectable()
export class ListChildrenTodayService implements ListChildrenTodayUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly repo: QuizQueryPort,

    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  /**
   * 오늘의 퀴즈(자녀용)
   * - 기준 날짜: Asia/Seoul(UTC+9)
   * - 커서: Base64("quizId")
   */
  async execute(cmd: ChildrenTodayQuizCommand): Promise<ChildrenTodayResponseResult> {
    const { childProfileId } = cmd;
    const limit = cmd.limit;
    const afterQuizId = decodeIdCursor(cmd.cursor ?? null);
    const todayYmd = todayYmdKST();

    // 1) DB에서 자녀에게 배정된 TODAY 목록 조회
    const { items, hasNext } = await this.repo.findChildrenToday({
      childProfileId,
      todayYmd,
      limit,
      afterQuizId: afterQuizId ?? undefined,
    });

    // 2) 부모 프로필 정보 배치 조회
    const parentIds = collectParentProfileIds(items);
    const parentMap = await getParentProfilesSafe(this.profiles, parentIds);

    // 3) 프로필 정보 보강
    const enrichedItems = this.enrichWithProfiles(items, parentMap);

    // 4) nextCursor 계산 (마지막 아이템의 quizId 기준)
    const nextCursor =
      hasNext && enrichedItems.length > 0
        ? encodeIdCursor(enrichedItems[enrichedItems.length - 1].quizId)
        : null;

    // 5) 응답 구성
    return {
      items: enrichedItems,
      nextCursor,
      hasNext,
    };
  }

  // ============== Helpers ==============

  /** 프로필 정보 보강 */
  private enrichWithProfiles(
    items: ChildrenTodayItemDto[],
    parentMap: Record<string, ParentProfileSummary>,
  ): ChildrenTodayItemDto[] {
    return items.map((q) => {
      const parent = parentMap[q.authorParentProfileId.toString()];
      return {
        quizId: q.quizId,
        question: q.question,
        hint: q.hint,
        reward: q.reward,
        authorParentProfileId: q.authorParentProfileId,
        authorParentName: parent?.name ?? '',
        authorParentAvatarMediaId: parent?.avatarMediaId ?? null,
        isSolved: q.isSolved,
      };
    });
  }
}
