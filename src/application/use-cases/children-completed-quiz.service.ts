import { Inject, Injectable } from '@nestjs/common';
import type {
  ChildrenCompletedResponseResult,
  ChildrenCompletedItemDto,
} from '../port/in/result/children-completed-quiz-result.dto';

import type { ListChildrenCompletedUseCase } from '../port/in/children-completed-quiz.usecase';
import type { ChildrenCompletedQuizCommand } from '../command/children-completed-quiz.command';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizQueryPort,
} from '../port/out/quiz.query.port';

import type { 
  ProfileDirectoryPort, 
  ParentProfileSummary, 
} from '../port/out/profile-directory.port';

// Utils
import { decodeCompositeCursor, encodeCompositeCursor } from '../../utils/cursor.util';
import { todayYmdKST } from 'src/utils/date.util';

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

  async execute(command: ChildrenCompletedQuizCommand): Promise<ChildrenCompletedResponseResult> {
      const { childProfileId, limit, cursor } = command;

      const rawCursor = decodeCompositeCursor(cursor ?? null);
      const paginationCursor = rawCursor ? { publishDateYmd: rawCursor.publishDateYmd, quizId: BigInt(rawCursor.quizId) } : undefined;

      const pageSize = Math.min(Math.max(limit ?? 10, 1), 50);
      const todayKst = todayYmdKST();

      // 1) 아이가 푼 퀴즈 중 오늘 이전 조회
      const { items: familyRows, hasNext } = await this.repo.findChildrenCompleted({
        childProfileId,
        beforeDateYmd: todayKst,
        paginationCursor,
        limit: pageSize,
      });

      // 2) 부모 프로필만 조회(이름/아바타 매핑)
      const { parents } = await this.profiles.getFamilyProfileWithScopeParents();
      const parentMap: Record<number, ParentProfileSummary> =
        Object.fromEntries((parents ?? []).map(parent => [parent.profileId, parent]));

      // 3) DTO 매핑
      const items: ChildrenCompletedItemDto[] = familyRows.map(row => {
        const author = parentMap[row.authorParentProfileId];
        return {
          quizId: row.quizId,
          publishDate: row.publishDateYmd,
          question: row.question,
          answer: row.answer,
          reward: row.reward,

          authorParentProfileId: row.authorParentProfileId,
          authorParentName: author?.name ?? '',
          authorParentAvatarMediaId: author?.avatarMediaId ?? null,
        };
      });

      const tail = items.at(-1);
      const nextCursor = 
        hasNext && tail ? encodeCompositeCursor(tail.publishDate, tail.quizId) : null;

      return { items, nextCursor, hasNext };
  }
}
