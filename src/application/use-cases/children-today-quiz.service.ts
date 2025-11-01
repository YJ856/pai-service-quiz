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

@Injectable()
export class ListChildrenTodayService implements ListChildrenTodayUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly repo: QuizQueryPort,

    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  async execute(command: ChildrenTodayQuizCommand): Promise<ChildrenTodayResponseResult> {
      const { childProfileId, limit, cursor } = command;

      const paginationCursor = decodeIdCursor(cursor ?? null) ?? undefined;

      const pageSize = Math.min(Math.max(limit ?? 10, 1), 50);
      const todayKst = todayYmdKST();

      // 1) 부모 프로필 조회
      const { parents } = await this.profiles.getFamilyProfileWithScopeParents();
      const parentMap: Record<number, ParentProfileSummary> =
        Object.fromEntries((parents ?? []).map(parent => [parent.profileId, parent]));
      const familyParentIds = (parents ?? []).map(parent => parent.profileId);

      if (familyParentIds.length === 0) {
        return { items: [], nextCursor: null, hasNext: false };
      }

      // 2) 오늘 퀴즈 조회
      const { items: familyRows, hasNext } = await this.repo.findFamilyParentsToday({
        parentProfileIds: familyParentIds,
        dateYmd: todayKst,
        paginationCursor,
        limit: pageSize,
      });

      // 3) 아이 본인 제출 여부만 조회 (퀴즈는 모두 포함, isSolved만 체크)
      const quizIds = familyRows.map(row => row.quizId);
      const assignmentMatrix = 
        quizIds.length 
        ? await this.repo.findAssignmentsForQuizzes({
            quizIds,
            childProfileIds: [childProfileId],
          })
        : [];

      const solvedSet = new Set(
        assignmentMatrix.filter(assignment => assignment.isSolved).map(assignment => String(assignment.quizId)),
      );

      // 4) DTO 매핑
      const items: ChildrenTodayItemDto[] = familyRows.map(row => {
        const author = parentMap[row.authorParentProfileId];
        return {
          quizId: row.quizId,
          question: row.question,
          hint: row.hint,
          reward: row.reward,

          authorParentProfileId: row.authorParentProfileId,
          authorParentName: author?.name ?? '',
          authorParentAvatarMediaId: author?.avatarMediaId ?? null,

          isSolved: solvedSet.has(String(row.quizId)),
        };
      });

      const tail = items.at(-1);
      const nextCursor = hasNext && tail ? encodeIdCursor(tail.quizId) : null;

    return { items, nextCursor, hasNext };
  }
}
