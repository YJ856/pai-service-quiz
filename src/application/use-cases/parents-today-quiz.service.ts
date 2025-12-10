import { Inject, Injectable } from '@nestjs/common';
import type { ParentsTodayResponseResult, ParentsTodayItemDto, } from '../port/in/result/parents-today-quiz-result.dto';

import type { ListParentsTodayUseCase, } from '../port/in/parents-today-quiz.usecase';
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

@Injectable()
export class ListParentsTodayService implements ListParentsTodayUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly repo: QuizQueryPort,

    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  async execute(command: ParentsTodayQuizCommand): Promise<ParentsTodayResponseResult> {
    const { parentProfileId, limit, cursor } = command;
    const paginationCursor = decodeIdCursor(cursor ?? null) ?? undefined;
    
    const pageSize = Math.min(Math.max(limit ?? 10, 1), 50);
    const todayKst = todayYmdKST();

    // 1) 가족 구성원 전체 프로필 조회
    const family = await this.profiles.getFamilyProfileWithScopeAll();
    const parentMap: Record<number, ParentProfileSummary> = 
      Object.fromEntries((family.parents ?? []).map(parent => [parent.profileId, parent]));
    const childMap: Record<number, ChildProfileSummary> = 
      Object.fromEntries((family.children ?? []).map(child => [child.profileId, child]));

    const familyParentIds = (family.parents ?? []).map(parent => parent.profileId);
    const familyChildIds = (family.children ?? []).map(child => child.profileId);
    if (familyParentIds.length === 0) {
      return { items: [], nextCursor: null, hasNext: false }
    }

    // 2) 오늘 퀴즈 조회
    const { items: familyRows, hasNext } = await this.repo.findFamilyParentsToday({
      parentProfileIds: familyParentIds,
      dateYmd: todayKst,
      paginationCursor,
      limit: pageSize,
    });

    // 3) 해당 퀴즈의 아이 제출 여부 조회
    const quizIds = familyRows.map(row => row.quizId);
    const assignmentMatrix: Array<{
      quizId: bigint;
      childProfileId: number;
      isSolved: boolean;
      rewardGranted: boolean;
    }> =
      (quizIds.length && familyChildIds.length)
        ? await this.repo.findAssignmentsForQuizzes({
            quizIds,
            childProfileIds: familyChildIds,
          })
        : [];

    // 빠른 접근
    const byQuizId: Record<string, Array<{ childProfileId: number; isSolved: boolean }>> = {};
    for (const assignment of assignmentMatrix) {
      (byQuizId[String(assignment.quizId)] ||= []).push({
        childProfileId: assignment.childProfileId,
        isSolved: !!assignment.isSolved,
      });
    }

    // DTO 매핑
    const items: ParentsTodayItemDto[] = familyRows.map(row => {
      const author = parentMap[row.authorParentProfileId];
      const solvedList = byQuizId[String(row.quizId)] ?? [];

      const children = familyChildIds.map(childId => {
        const childInfo = childMap[childId];
        const found = solvedList.find(assignment => assignment.childProfileId === childId);
        return {
          childProfileId: childId,
          childName: childInfo?.name ?? '',
          childAvatarMediaId: childInfo?.avatarMediaId ?? null,
          isSolved: found ? found.isSolved : false,
        };
      });
      return {
        quizId: row.quizId,
        question: row.question,
        answer: row.answer,
        hint: row.hint,
        reward: row.reward,

        authorParentProfileId: row.authorParentProfileId,
        authorParentName: author?.name ?? '',
        authorParentAvatarMediaId: author?.avatarMediaId ?? null,

        children,
      };
    });

    const tail = items.at(-1);
    const nextCursor = hasNext && tail ? encodeIdCursor(tail.quizId) : null;
    return { items, nextCursor, hasNext };
  }
}
