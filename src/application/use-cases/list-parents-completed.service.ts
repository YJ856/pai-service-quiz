import { Inject, Injectable } from '@nestjs/common';
import type {
  ParentsCompletedResponseData,
  ParentsCompletedItemDto,
} from 'pai-shared-types';

import type {
  ListParentsCompletedQuery,
  ListParentsCompletedUseCase,
} from '../port/in/list-parents-completed.usecase';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizParentsQueryRepositoryPort,
  FindParentsCompletedParams,
} from '../port/out/quiz-parents-query.repository.port';

import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
  ChildProfileSummary,
} from '../port/out/profile-directory.port';

// Utils
import { clampLimit } from '../../utils/pagination.util';
import { decodeCompositeCursor, encodeCompositeCursor } from '../../utils/cursor.util';
import {
  getParentProfileSafe,
  getChildProfilesSafe,
  collectChildProfileIds,
} from '../../utils/profile.util';

@Injectable()
export class ListParentsCompletedService implements ListParentsCompletedUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizParentsQueryRepositoryPort)
    private readonly repo: QuizParentsQueryRepositoryPort,

    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  /**
   * 완료된 퀴즈(부모용)
   * - 정렬: publishDate DESC, quizId DESC
   * - 커서: Base64("\"yyyy-MM-dd|quizId\"")
   */
  async execute(params: ListParentsCompletedQuery): Promise<ParentsCompletedResponseData> {
    const { parentProfileId } = params;
    const limit = clampLimit(params.limit);
    const after = decodeCompositeCursor(params.cursor);

    // 1) DB 조회
    const findParams: FindParentsCompletedParams = {
      parentProfileId,
      limit,
      after: after ?? undefined,
    };
    const { items, hasNext } = await this.repo.findParentsCompleted(findParams);

    // 2) 프로필 정보 배치 조회
    const [parent, childMap] = await Promise.all([
      getParentProfileSafe(this.profiles, Number(parentProfileId)),
      getChildProfilesSafe(this.profiles, collectChildProfileIds(items)),
    ]);

    // 3) 프로필 정보 합치기
    const merged = this.enrichWithProfiles(items, parent, childMap);

    // 4) nextCursor (DESC 정렬이므로 "페이지의 마지막 아이템" 기준)
    const tail = merged.length ? merged[merged.length - 1] : null;
    const nextCursor =
      hasNext && tail
        ? encodeCompositeCursor(tail.publishDate, tail.quizId)
        : null;

    return {
      items: merged,
      nextCursor,
      hasNext,
    };
  }

  // ============== Helpers ==============

  /** DB rows + 외부 프로필을 합쳐 최종 DTO로 */
  private enrichWithProfiles(
    rows: ParentsCompletedItemDto[],
    parent: ParentProfileSummary | null,
    childMap: Record<number, ChildProfileSummary>,
  ): ParentsCompletedItemDto[] {
    return rows.map((q) => ({
      ...q,
      authorParentName: parent?.name ?? q.authorParentName ?? '부모',
      authorParentAvatarMediaId:
        parent?.avatarMediaId ?? q.authorParentAvatarMediaId ?? null,
      children: q.children.map((c) => {
        const info = childMap[c.childProfileId];
        return {
          ...c,
          childName: info?.name ?? c.childName ?? '',
          childAvatarMediaId: info?.avatarMediaId ?? c.childAvatarMediaId ?? null,
        };
      }),
    }));
  }
}
