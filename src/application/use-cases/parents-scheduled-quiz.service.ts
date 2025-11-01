import { Inject, Injectable } from '@nestjs/common';
import type { ParentsScheduledResponseResult, ParentsScheduledItemDto } from '../port/in/result/parents-scheduled-quiz-result.dto';

import type { ListParentsScheduledUseCase,} from '../port/in/parents-scheduled-quiz.usecase';
import type { ParentsScheduledQuizCommand } from '../command/parents-scheduled-quiz.command';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizQueryPort,
} from '../port/out/quiz.query.port';
import type { ProfileDirectoryPort, ParentProfileSummary } from '../port/out/profile-directory.port';

// Utils
import { decodeCompositeCursor, encodeCompositeCursor } from '../../utils/cursor.util';
import { todayYmdKST } from '../../utils/date.util';


@Injectable()
export class ListParentsScheduledService implements ListParentsScheduledUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly repo: QuizQueryPort,
    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  async execute(command: ParentsScheduledQuizCommand): Promise<ParentsScheduledResponseResult> {
    const { parentProfileId, limit, cursor } = command;

    const rawCursor = decodeCompositeCursor(cursor ?? null);
    const paginationCursor = rawCursor ? { publishDateYmd: rawCursor.publishDateYmd, quizId: BigInt(rawCursor.quizId)} : undefined;

    const pageSize = Math.min(Math.max(limit ?? 10, 1), 50);
    const todayKst = todayYmdKST();

    // 1) 가족 부모 프로필 조회
    const { parents } = await this.profiles.getFamilyProfileWithScopeParents();
    const parentMap: Record<number, ParentProfileSummary> = 
      Object.fromEntries((parents ?? []).map(parent => [parent.profileId, parent]));
    const familyParentIds = (parents ?? []).map(parent => parent.profileId);

    if (familyParentIds.length === 0) {
      return { items: [], nextCursor: null, hasNext: false };
    }

    // 2) 예정된 퀴즈 조회
    const { items: familyRows, hasNext } = await this.repo.findFamilyParentsScheduled({
      parentProfileIds: familyParentIds,
      afterDateYmd: todayKst,
      paginationCursor,
      limit: pageSize,
    });

    // 3) DTO 매핑
    const items: ParentsScheduledItemDto[] = familyRows.map(row => {
      const author = parentMap[row.authorParentProfileId];
      return {
        quizId: row.quizId,
        publishDate: row.publishDateYmd,
        question: row.question,
        answer: row.answer,
        hint: row.hint,
        reward: row.reward,

        authorParentProfileId: row.authorParentProfileId,
        authorParentName: author?.name ?? '',
        authorParentAvatarMediaId: author?.avatarMediaId ?? null,

        isEditable: row.authorParentProfileId === parentProfileId,
      };
    });

    const tail = items.at(-1);
    const nextCursor = 
      hasNext && tail ? encodeCompositeCursor(tail.publishDate, tail.quizId) : null;

    return { items, nextCursor, hasNext };
  }
}
