import { Inject, Injectable } from '@nestjs/common';
import type { ChildrenCompletedResponseData } from 'pai-shared-types';

import type {
  ListChildrenCompletedUseCase,
} from '../port/in/list-children-completed.usecase';
import type { ChildrenCompletedCommand } from '../command/children-completed.command';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizQueryPort,
  FindChildrenCompletedParams,
} from '../port/out/quiz.query.port';

import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
} from '../port/out/profile-directory.port';

// Utils
import { decodeCompositeCursor, encodeCompositeCursor } from '../../utils/cursor.util';
import {
  getParentProfilesSafe,
  collectParentProfileIds,
} from '../../utils/profile.util';

/**
 * 아이용 완료된 퀴즈 조회
 * - 정렬: publishDate DESC, id DESC
 * - 커서: Base64("yyyy-MM-dd|quizId")
 * - "본인이 푼 것만"은 Repository에서 필터링
 */
@Injectable()
export class ListChildrenCompletedService implements ListChildrenCompletedUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly repo: QuizQueryPort,

    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  async execute(cmd: ChildrenCompletedCommand): Promise<ChildrenCompletedResponseData> {
    const limit = cmd.limit;
    const after = decodeCompositeCursor(cmd.cursor ?? null);

    const query: FindChildrenCompletedParams = {
      childProfileId: cmd.childProfileId,
      limit,
      ...(after ? { after } : {}),
    };

    // 1) DB 조회
    const { items, hasNext } = await this.repo.findChildrenCompleted(query);

    // 2) 부모 프로필 정보 배치 조회
    const parentIds = collectParentProfileIds(items);
    const parentMap = await getParentProfilesSafe(this.profiles, parentIds);

    // 3) 프로필 정보 보강
    const enrichedItems = this.enrichWithProfiles(items, parentMap);

    // 4) nextCursor 계산
    const last = enrichedItems[enrichedItems.length - 1];
    const nextCursor =
      hasNext && last
        ? encodeCompositeCursor(last.publishDate, last.quizId)
        : null;

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
        status: 'COMPLETED' as const, // publishDate < today 이므로 항상 COMPLETED
        publishDate: q.publishDate,
        question: q.question,
        answer: q.answer,
        reward: q.reward ?? undefined,
        authorParentProfileId: q.authorParentProfileId,
        authorParentName: parent?.name ?? q.authorParentName ?? '부모',
        authorParentAvatarMediaId: parent?.avatarMediaId ?? q.authorParentAvatarMediaId ?? null,
      };
    });
  }
}
