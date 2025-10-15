import { Inject, Injectable } from '@nestjs/common';
import type { ChildrenCompletedResponseData } from 'pai-shared-types';

import type {
  ListChildrenCompletedQuery,
  ListChildrenCompletedUseCase,
} from '../port/in/list-children-completed.usecase';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizChildrenQueryRepositoryPort,
  FindChildrenCompletedParams,
} from '../port/out/quiz-children-query.repository.port';

import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
} from '../port/out/profile-directory.port';

/**
 * 아이용 완료된 퀴즈 조회
 * - 정렬: publishDate DESC, id DESC
 * - 커서: Base64("yyyy-MM-dd|quizId")
 * - "본인이 푼 것만"은 Repository에서 필터링
 */
@Injectable()
export class ListChildrenCompletedService implements ListChildrenCompletedUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizChildrenQueryRepositoryPort)
    private readonly repo: QuizChildrenQueryRepositoryPort,

    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  async execute(params: ListChildrenCompletedQuery): Promise<ChildrenCompletedResponseData> {
    const limit = this.clampLimit(params.limit);
    const after = this.decodeCursor(params.cursor); // { publishDateYmd, quizId } | null

    const query: FindChildrenCompletedParams = {
      childProfileId: params.childProfileId,
      limit,
      ...(after ? { after } : {}),
    };

    // 1) DB 조회
    const { items, hasNext } = await this.repo.findChildrenCompleted(query);

    // 2) 부모 프로필 정보 배치 조회
    const parentIds = this.collectParentIds(items);
    const parentMap = await this.getParentsSafe(parentIds);

    // 3) 프로필 정보 보강
    const enrichedItems = this.enrichWithProfiles(items, parentMap);

    // 4) nextCursor 계산
    const last = enrichedItems[enrichedItems.length - 1];
    const nextCursor =
      hasNext && last
        ? this.encodeCursor(last.publishDate, last.quizId)
        : null;

    return {
      items: enrichedItems,
      nextCursor,
      hasNext,
    };
  }

  // ============== Helpers ==============

  private clampLimit(n: number): number {
    const v = Number(n ?? 20);
    if (!Number.isFinite(v)) return 20;
    if (v < 1) return 1;
    if (v > 50) return 50;
    return v;
  }

  /** Base64("yyyy-MM-dd|123") or Base64("\"yyyy...|123\"") → { publishDateYmd, quizId } */
  private decodeCursor(cursor: string | null): { publishDateYmd: string; quizId: number } | null {
    if (!cursor) return null;
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      const raw = this.safeJsonParse(decoded);
      const s = typeof raw === 'string' ? raw : decoded;
      const [ymd, idStr] = String(s).split('|');
      const quizId = Number(idStr);
      if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
      if (!Number.isFinite(quizId) || quizId <= 0) return null;
      return { publishDateYmd: ymd, quizId };
    } catch {
      return null;
    }
  }

  /** { ymd, id } → Base64("\"yyyy-MM-dd|123\"") (부모용 커서 포맷과 동일) */
  private encodeCursor(publishDateYmd: string, quizId: number): string {
    const payload = JSON.stringify(`${publishDateYmd}|${quizId}`);
    return Buffer.from(payload, 'utf8').toString('base64');
  }

  private safeJsonParse(input: string): unknown {
    try {
      return JSON.parse(input);
    } catch {
      return input;
    }
  }

  /** 아이템에서 부모 프로필 ID 수집 */
  private collectParentIds(items: any[]): number[] {
    const set = new Set<number>();
    for (const it of items) {
      set.add(it.authorParentProfileId);
    }
    return Array.from(set);
  }

  /** 부모 프로필 정보 배치 조회 (안전) */
  private async getParentsSafe(ids: number[]): Promise<Record<number, ParentProfileSummary>> {
    try {
      if (ids.length === 0) return {};
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const profile = await this.profiles.getParentProfile(id);
            return profile ? [id, profile] as const : null;
          } catch {
            return null;
          }
        })
      );
      return Object.fromEntries(results.filter((r): r is [number, ParentProfileSummary] => r !== null));
    } catch {
      return {};
    }
  }

  /** 프로필 정보 보강 */
  private enrichWithProfiles(
    items: any[],
    parentMap: Record<number, ParentProfileSummary>,
  ): any[] {
    return items.map((q) => {
      const parent = parentMap[q.authorParentProfileId];
      return {
        quizId: q.quizId,
        status: q.status, // 'COMPLETED'
        publishDate: q.publishDate,
        question: q.question,
        answer: q.answer,
        reward: q.reward ?? undefined,
        authorParentProfileId: q.authorParentProfileId,
        authorParentName: parent?.name ?? q.authorParentName ?? '부모',
        authorParentAvatarMediaId: parent?.avatarMediaId ?? q.authorParentAvatarMediaId ?? null,
      };
    });
  }
}
