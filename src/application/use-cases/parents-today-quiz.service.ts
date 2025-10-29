import { Inject, Injectable } from '@nestjs/common';
import type { ParentsTodayResponseResult, ParentsTodayItemDto, } from '../port/in/result/parents-today-quiz-result.dto';

import type {
  ListParentsTodayUseCase,
} from '../port/in/parents-today-quiz.usecase';
import type { ParentsTodayQuizCommand } from '../command/parents-today-quiz.command';

import { QUIZ_TOKENS } from '../../quiz.token';
import type { QuizQueryPort } from '../port/out/quiz.query.port';
import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
  ChildProfileSummary,
} from '../port/out/profile-directory.port';

// Utils
import { todayYmdKST } from '../../utils/date.util';
import { decodeIdCursor, encodeIdCursor } from '../../utils/cursor.util';
import {
  getParentProfileSafe,
  getChildProfilesSafe,
  collectChildProfileIds,
} from '../../utils/profile.util';

@Injectable()
export class ListParentsTodayService implements ListParentsTodayUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly repo: QuizQueryPort,

    // 외부 User 서비스 포트 주입
    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  /**
   * 오늘의 퀴즈(부모용)
   * - 기준 날짜: Asia/Seoul(UTC+9)
   * - 커서: Base64("quizId")
   */
  async execute(cmd: ParentsTodayQuizCommand): Promise<ParentsTodayResponseResult> {
    const { parentProfileId } = cmd;
    const limit = cmd.limit;
    const afterQuizId = decodeIdCursor(cmd.cursor ?? null);
    const todayYmd = todayYmdKST();

    // 1) DB에서 기본 목록
    const { items, hasNext } = await this.repo.findParentsToday({
      parentProfileId,
      todayYmd,
      limit,
      afterQuizId: afterQuizId ?? undefined,
    });

    // 2) 프로필 정보 배치 조회
    const [parent, childMap] = await Promise.all([
      getParentProfileSafe(this.profiles, parentProfileId),
      getChildProfilesSafe(this.profiles, collectChildProfileIds(items)),
    ]);

    // 3) 응답에 프로필 정보 합치기
    const merged = this.enrichWithProfiles(items, parent, childMap);

    const nextCursor = hasNext
      ? encodeIdCursor(merged[merged.length - 1].quizId)
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
    rows: ParentsTodayItemDto[],
    parent: ParentProfileSummary | null,
    childMap: Record<string, ChildProfileSummary>,
  ): ParentsTodayItemDto[] {
    return rows.map((q) => ({
      ...q,
      authorParentProfileId: q.authorParentProfileId,
      authorParentName: parent?.name ?? q.authorParentName ?? '부모',
      authorParentAvatarMediaId: parent?.avatarMediaId ?? q.authorParentAvatarMediaId ?? null,
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
