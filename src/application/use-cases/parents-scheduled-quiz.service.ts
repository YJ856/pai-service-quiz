import { Inject, Injectable } from '@nestjs/common';
import type { ParentsScheduledResponseResult, ParentsScheduledItemDto } from '../port/in/result/parents-scheduled-quiz-result.dto';

import type { ListParentsScheduledUseCase,} from '../port/in/parents-scheduled-quiz.usecase';
import type { ParentsScheduledQuizCommand } from '../command/parents-scheduled-quiz.command';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizQueryPort,
  FindParentsScheduledParams,
} from '../port/out/quiz.query.port';
import type { ProfileDirectoryPort, ParentProfileSummary } from '../port/out/profile-directory.port';

// Utils
import { decodeCompositeCursor, encodeCompositeCursor } from '../../utils/cursor.util';
import { getParentProfileSafe } from '../../utils/profile.util';
import { todayYmdKST } from '../../utils/date.util';

const isEditable = (
  publishDate: string,
  authorParentProfileId: number,
  requesterParentProfileId: number,
  today: string
): boolean => {
  // 작성자만 수정 가능
  if (authorParentProfileId !== requesterParentProfileId) {
    return false;
  }
  // publishDate가 오늘 이후인 경우만 수정 가능 (SCHEDULED 상태)
  if (publishDate > today) {
    return true;
  }
  return false;
};

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
  async execute(cmd: ParentsScheduledQuizCommand): Promise<ParentsScheduledResponseResult> {
    const { parentProfileId } = cmd;
    const limit = cmd.limit;
    const after = decodeCompositeCursor(cmd.cursor ?? null);

    // 1) DB 조회
    const findParams: FindParentsScheduledParams = {
      parentProfileId,
      limit,
      after: after ?? undefined,
    };
    const { items, hasNext } = await this.repo.findParentsScheduled(findParams);

    // 2) 부모 프로필(이름/아바타) 보강
    const parent = await getParentProfileSafe(this.profiles, parentProfileId);
    const merged = this.enrichWithParent(items, parent, parentProfileId);

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
    const today = todayYmdKST();

    return rows.map((q) => {
      // 도메인 정책 사용: publishDate > today && 본인 작성
      const editable = isEditable(
        q.publishDate,
        q.authorParentProfileId,
        requesterParentId,
        today,
      );

      return {
        ...q,
        authorParentName: parent?.name ?? '',
        authorParentAvatarMediaId: parent?.avatarMediaId ?? null,
        isEditable: editable,
      };
    });
  }
}
