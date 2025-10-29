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
  FindChildrenCompletedParams,
} from '../port/out/quiz.query.port';

import type { 
  ProfileDirectoryPort, 
  ParentProfileSummary, 
} from '../port/out/profile-directory.port';

// Utils
import { decodeCompositeCursor, encodeCompositeCursor } from '../../utils/cursor.util';
import { getParentProfilesSafe, collectParentProfileIds, } from '../../utils/profile.util';

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
    const limit = command.limit;
    
    // 1) 커서 디코드 → 레포 after 형식으로 매핑
    const rawAfter = command.cursor ? decodeCompositeCursor(command.cursor) : null;
    // rawAfter 예상 형태: { publishDateYmd: string, quizId: bigint }
    const after = rawAfter ?? undefined;

    const query: FindChildrenCompletedParams = {
      childProfileId: command.childProfileId,
      limit,
      ...(after ? { after } : {}),
    };

    // 2) DB 조회
    const { items, hasNext } = await this.repo.findChildrenCompleted(query);

    // 3) 부모 프로필 정보 배치 조회
    const parentIds = collectParentProfileIds(items);
    const parentMap = await getParentProfilesSafe(this.profiles, parentIds);

    // 4) 프로필 정보 보강
    const enrichedItems = this.enrichWithProfiles(items, parentMap);

    // 5) nextCursor 계산
    const last = enrichedItems[enrichedItems.length - 1];
    const nextCursor =
      hasNext && last
        ? encodeCompositeCursor(last.publishDate, last.quizId)
        : null;

    return {
      items: enrichedItems,
      nextCursor,
      hasNext,
    };
  }

  // ============== Helpers ==============

  /** 프로필 정보 보강 */
  private enrichWithProfiles(
    items: ChildrenCompletedItemDto[],
    parentMap: Record<string, ParentProfileSummary>,
  ): ChildrenCompletedItemDto[] {
    return items.map((q) => {
      const parent = parentMap[q.authorParentProfileId.toString()];
      return {
        quizId: q.quizId,
        publishDate: q.publishDate,
        question: q.question,
        answer: q.answer,
        reward: q.reward,
        authorParentProfileId: q.authorParentProfileId,
        authorParentName: parent?.name ?? q.authorParentName ?? '부모',
        authorParentAvatarMediaId: parent?.avatarMediaId ?? q.authorParentAvatarMediaId ?? null,
      };
    });
  }
}
