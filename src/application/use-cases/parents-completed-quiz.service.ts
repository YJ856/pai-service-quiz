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
    const paginationCursor = decodeCompositeCursor(cursor ?? null);
    const todayKst = todayYmdKST()

    // 1) 가족 구성원 모두의 프로필 정보 요청(부모, 아이 모두)


    // 2) 불러온 부모 ID가 출제자 ID와 동일하면서 날짜가 오늘 이전인 퀴즈 정보 조회(DB 조회)


    // 3) 해당 퀴즈의 아이 제출 여부 조회(quizId로 Assignment테이블 DB 조회, 있으면 맞춘 거고 없으면 못 맞춘 것)


    // 4) 모든 정보를 형식에 맞춰서 넣은 뒤 날짜가 최신순 내림차순으로 보내기



    // 1) DB 조회
    const findParams: FindParentsCompletedParams = {
      parentProfileId,
      limit,
      paginationCursor: paginationCursor ?? undefined,
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
