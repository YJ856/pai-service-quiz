import { Inject, Injectable } from '@nestjs/common';
import type { ChildrenTodayResponseData } from 'pai-shared-types';

import type {
  ListChildrenTodayQuery,
  ListChildrenTodayUseCase,
} from '../port/in/list-children-today.usecase';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizChildrenQueryRepositoryPort,
} from '../port/out/quiz-children-query.repository.port';

import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
} from '../port/out/profile-directory.port';

// Utils
import { getTodayYmdKST } from '../../utils/date.util';
import { clampLimit } from '../../utils/pagination.util';
import { decodeIdCursor, encodeIdCursor } from '../../utils/cursor.util';
import {
  getParentProfilesSafe,
  collectParentProfileIds,
} from '../../utils/profile.util';

@Injectable()
export class ListChildrenTodayService implements ListChildrenTodayUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizChildrenQueryRepositoryPort)
    private readonly repo: QuizChildrenQueryRepositoryPort,

    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  /**
   * 오늘의 퀴즈(자녀용)
   * - 기준 날짜: Asia/Seoul(UTC+9)
   * - 커서: Base64("quizId")
   */
  async execute(params: ListChildrenTodayQuery): Promise<ChildrenTodayResponseData> {
    const { childProfileId } = params;
    const limit = clampLimit(params.limit);
    const afterQuizId = decodeIdCursor(params.cursor);
    const todayYmd = getTodayYmdKST();

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
      hasNext && items.length > 0
        ? encodeIdCursor(items[items.length - 1].quizId)
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
    items: any[],
    parentMap: Record<number, ParentProfileSummary>,
  ): any[] {
    return items.map((q) => {
      const parent = parentMap[q.authorParentProfileId];
      return {
        quizId: q.quizId,
        status: q.status, // 'TODAY'
        question: q.question,
        hint: q.hint ?? undefined,
        // 정책: 미해결이면 reward 미포함(또는 null). 현재는 미포함 쪽으로 매핑.
        reward: q.isSolved ? q.reward ?? undefined : undefined,
        authorParentProfileId: q.authorParentProfileId,
        authorParentName: parent?.name ?? q.authorParentName ?? '부모',
        authorParentAvatarMediaId: parent?.avatarMediaId ?? q.authorParentAvatarMediaId ?? null,
        isSolved: q.isSolved,
      };
    });
  }
}
