import { Inject, Injectable } from '@nestjs/common';
import type { ParentsScheduledResponseData, ParentsScheduledItemDto } from 'pai-shared-types';

import type {
  ListParentsScheduledQuery,
  ListParentsScheduledUseCase,
} from '../port/in/list-parents-scheduled.usecase';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizQueryPort,
  FindParentsScheduledParams,
} from '../port/out/quiz.query.port';
import type { ProfileDirectoryPort, ParentProfileSummary } from '../port/out/profile-directory.port';

// Utils
import { clampLimit } from '../../utils/pagination.util';
import { decodeCompositeCursor, encodeCompositeCursor } from '../../utils/cursor.util';
import { getParentProfileSafe } from '../../utils/profile.util';

@Injectable()
export class ListParentsScheduledService implements ListParentsScheduledUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly repo: QuizQueryPort,
    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  /**
   * 예정된 퀴즈(부모용)
   * - 정렬: publishDate ASC, quizId ASC
   * - 커서: Base64("\"yyyy-MM-dd|quizId\"")
   */
  async execute(params: ListParentsScheduledQuery): Promise<ParentsScheduledResponseData> {
    const { parentProfileId } = params;
    const limit = clampLimit(params.limit);
    const after = decodeCompositeCursor(params.cursor);

    // 1) DB 조회
    const findParams: FindParentsScheduledParams = {
      parentProfileId,
      limit,
      after: after ?? undefined,
    };
    const { items, hasNext } = await this.repo.findParentsScheduled(findParams);

    // 2) 부모 프로필(이름/아바타) 보강
    const parent = await getParentProfileSafe(this.profiles, Number(parentProfileId));
    const merged = this.enrichWithParent(items, parent, Number(parentProfileId));

    // 3) nextCursor (ASC 정렬이므로 페이지의 마지막 아이템 기준)
    const tail = merged.length ? merged[merged.length - 1] : null;
    const nextCursor = hasNext && tail ? encodeCompositeCursor(tail.publishDate, tail.quizId) : null;

    return {
      items: merged,
      nextCursor,
      hasNext,
    };
  }

  // ============== Helpers ==============

  private enrichWithParent(
    rows: ParentsScheduledItemDto[],
    parent: ParentProfileSummary | null,
    requesterParentId: number,
  ): ParentsScheduledItemDto[] {
    return rows.map((q) => {
      const isEditable =
        q.status === 'SCHEDULED' && q.authorParentProfileId === requesterParentId;
      return {
        ...q,
        authorParentName: parent?.name ?? q.authorParentName ?? '부모',
        authorParentAvatarMediaId: parent?.avatarMediaId ?? q.authorParentAvatarMediaId ?? null,
        isEditable,
      };
    });
  }
}
