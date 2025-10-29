import { Inject, Injectable } from '@nestjs/common';
import type { ParentsCompletedResponseResult, ParentsCompletedItemDto, } from '../port/in/result/parents-completed-quiz-result.dto';

import type { ListParentsCompletedUseCase,} from '../port/in/parents-completed-quiz.usecase';
import type { ParentsCompletedQuizCommand } from '../command/parents-completed-quiz.command';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizQueryPort,
  FindParentsCompletedParams,
} from '../port/out/quiz.query.port';

import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
  ChildProfileSummary,
} from '../port/out/profile-directory.port';

// Utils
import { decodeCompositeCursor, encodeCompositeCursor } from '../../utils/cursor.util';
import {
  getParentProfileSafe,
  getChildProfilesSafe,
  collectChildProfileIds,
} from '../../utils/profile.util';

@Injectable()
export class ListParentsCompletedService implements ListParentsCompletedUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly repo: QuizQueryPort,

    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  /**
   * 완료된 퀴즈(부모용)
   * - 정렬: publishDate DESC, quizId DESC
   * - 커서: Base64("\"yyyy-MM-dd|quizId\"")
   */
  async execute(cmd: ParentsCompletedQuizCommand): Promise<ParentsCompletedResponseResult> {
    const { parentProfileId } = cmd;
    const limit = cmd.limit;
    const after = decodeCompositeCursor(cmd.cursor ?? null);

    // 1) DB 조회
    const findParams: FindParentsCompletedParams = {
      parentProfileId,
      limit,
      after: after ?? undefined,
    };
    const { items, hasNext } = await this.repo.findParentsCompleted(findParams);

    // 2) 프로필 정보 배치 조회
    const [parent, childMap] = await Promise.all([
      getParentProfileSafe(this.profiles, parentProfileId),
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
    childMap: Record<string, ChildProfileSummary>,
  ): ParentsCompletedItemDto[] {
    return rows.map((q) => ({
      ...q,
      authorParentName: parent?.name ?? '',
      authorParentAvatarMediaId: parent?.avatarMediaId ?? null,
      children: q.children.map((c) => {
        const info = childMap[c.childProfileId.toString()];
        return {
          ...c,
          childName: info?.name ?? c.childName ?? '',
          childAvatarMediaId: info?.avatarMediaId ?? c.childAvatarMediaId ?? null,
        };
      }),
    }));
  }
}
