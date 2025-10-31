import { Inject, Injectable } from '@nestjs/common';
import type { ParentsCompletedResponseResult, ParentsCompletedItemDto, } from '../port/in/result/parents-completed-quiz-result.dto';

import type { ListParentsCompletedUseCase,} from '../port/in/parents-completed-quiz.usecase';
import type { ParentsCompletedQuizCommand } from '../command/parents-completed-quiz.command';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizQueryPort,
} from '../port/out/quiz.query.port';

import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
  ChildProfileSummary,
} from '../port/out/profile-directory.port';

// Utils
import { decodeCompositeCursor, encodeCompositeCursor } from '../../utils/cursor.util';
import { todayYmdKST } from 'src/utils/date.util';

@Injectable()
export class ListParentsCompletedService implements ListParentsCompletedUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizQueryPort)
    private readonly repo: QuizQueryPort,

    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  async execute(command: ParentsCompletedQuizCommand): Promise<ParentsCompletedResponseResult> {
    const { parentProfileId, limit, cursor } = command;
    const rawCursor = decodeCompositeCursor(cursor ?? null);
    const paginationCursor = rawCursor ? { publishDateYmd: rawCursor.publishDateYmd, quizId: BigInt(rawCursor.quizId)} : undefined;
    
    const pageSize = Math.min(Math.max(limit ?? 10, 1), 50);
    const todayKst = todayYmdKST();

    // 1) 가족 구성원 모두의 프로필 정보 요청(부모, 아이 모두)
    const family = await this.profiles.getFamilyProfileWithScopeAll();
    const parentMap: Record<number, ParentProfileSummary> = 
      Object.fromEntries((family.parents ?? []).map(parent => [parent.profileId, parent]));
    const childMap: Record<number, ChildProfileSummary> =
      Object.fromEntries((family.children ?? []).map(child => [child.profileId, child]));

    // 가족 내 모든 부모 ID
    const familyParentIds = (family.parents ?? []).map(parent => parent.profileId);
    const familyChildIds = (family.children ?? []).map(child => child.profileId);
    if (familyParentIds.length === 0) {
      return { items: [], nextCursor: null, hasNext: false }
    }

    // 2) 불러온 부모 ID가 출제자 ID와 동일하면서 날짜가 오늘 이전인 퀴즈 정보 조회(DB 조회)
    const { items: familyRows, hasNext } = await this.repo.findFamilyParentsCompleted({
      parentProfileIds: familyParentIds,
      beforeDateYmd: todayKst,
      paginationCursor,
      limit: pageSize,
    });

    // 3) 해당 퀴즈의 아이 제출 여부 조회(quizId로 Assignment테이블 DB 조회, 있으면 맞춘 거고 없으면 못 맞춘 것)
    let assignmentMatrix: Array<{
      quizId: bigint;
      childProfileId: number;
      isSolved: boolean;
      rewardGranted: boolean;
    }> = [];

    const quizIds = familyRows.map(row => row.quizId);
    if (quizIds.length && familyChildIds.length) {
      assignmentMatrix = await this.repo.findAssignmentsForQuizzes({
        quizIds,
        childProfileIds: familyChildIds,
      });
    }

    // 빠른 접근 맵: quizId → [{ childProfileId, isSolved, rewardGranted }, ...]
    const byQuizId: Record<string, Array<{ childProfileId: number; isSolved: boolean; rewardGranted: boolean }>> = {};
    for (const assignment of assignmentMatrix) {
      const key = String(assignment.quizId);
      (byQuizId[key] ||= []).push({
        childProfileId: assignment.childProfileId,
        isSolved: !!assignment.isSolved,
        rewardGranted: !!assignment.rewardGranted,
      });
    }

    // 4) 모든 정보를 형식에 맞춰서 넣은 뒤 날짜가 최신순 내림차순으로 보내기
    const items: ParentsCompletedItemDto[] = familyRows.map(row => {
      const author = parentMap[row.authorParentProfileId];
      const solvedList = byQuizId[String(row.quizId)] ?? [];

      // 정책 ①: 가족의 모든 아이를 Children에 포함(과제 없으면 false)
      const children = familyChildIds.map(childId => {
        const childInfo = childMap[childId];
        const found = solvedList.find(assignment => assignment.childProfileId === childId);
        return {
          childProfileId: childId,
          childName: childInfo?.name ?? '',
          childAvatarMediaId: childInfo?.avatarMediaId ?? null,
          isSolved: found ? found.isSolved : false,
          rewardGranted: found ? found.rewardGranted : false,
        };
      });

      return {
        quizId: row.quizId,
        publishDate: row.publishDateYmd, // 'yyyy-MM-dd'
        question: row.question,
        answer: row.answer,
        reward: row.reward,

        authorParentProfileId: row.authorParentProfileId,
        authorParentName: author?.name ?? '',
        authorParentAvatarMediaId: author?.avatarMediaId ?? null,

        children,
      };
    });

    // nextCursor: DESC이므로 마지막 아이템 기준
    const tail = items.at(-1);
    const nextCursor =
      hasNext && tail ? encodeCompositeCursor(tail.publishDate, tail.quizId) : null;

    return { items, nextCursor, hasNext };
  }
}

