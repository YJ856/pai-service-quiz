import { Inject, Injectable } from '@nestjs/common';
import type { ChildrenTodayResponseData } from 'pai-shared-types';

import type {
  ListChildrenTodayQuery,
  ListChildrenTodayUseCase,
} from '../port/in/list-children-today.usecase';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizChildrenQueryRepositoryPort,
} from '../port/out/quiz-children-query.repository.port';

import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
} from '../port/out/profile-directory.port';

@Injectable()
export class ListChildrenTodayService implements ListChildrenTodayUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizChildrenQueryRepositoryPort)
    private readonly repo: QuizChildrenQueryRepositoryPort,

    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  /**
   * 오늘의 퀴즈(자녀용)
   * - 기준 날짜: Asia/Seoul(UTC+9)
   * - 커서: Base64("quizId")
   */
  async execute(params: ListChildrenTodayQuery): Promise<ChildrenTodayResponseData> {
    const { childProfileId } = params;
    const limit = this.clampLimit(params.limit);
    const afterQuizId = this.decodeCursorToAfterId(params.cursor);

    const todayYmd = this.getTodayYmdKST();

    // 1) DB에서 자녀에게 배정된 TODAY 목록 조회
    const { items, hasNext } = await this.repo.findChildrenToday({
      childProfileId,
      todayYmd,
      limit,
      afterQuizId: afterQuizId ?? undefined,
    });

    // 2) 부모 프로필 정보 배치 조회
    const parentIds = this.collectParentIds(items);
    const parentMap = await this.getParentsSafe(parentIds);

    // 3) 프로필 정보 보강
    const enrichedItems = this.enrichWithProfiles(items, parentMap);

    // 4) nextCursor 계산 (마지막 아이템의 quizId 기준)
    const nextCursor =
      hasNext && items.length > 0
        ? this.encodeAfterIdToCursor(items[items.length - 1].quizId)
        : null;

    // 5) 응답 구성
    return {
      items: enrichedItems,
      nextCursor,
      hasNext,
    };
  }

  // ============== Helpers ==============

  private clampLimit(n: number): number {
    // 부모용과 동일 규칙: 1..50
    const v = Number(n ?? 20);
    if (!Number.isFinite(v)) return 20;
    if (v < 1) return 1;
    if (v > 50) return 50;
    return v;
  }

  /** Base64("\"123\"") 또는 Base64("123") → 123 */
  private decodeCursorToAfterId(cursor: string | null): number | null {
    if (!cursor) return null;
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      const raw = this.safeJsonParse(decoded);
      const s = typeof raw === 'string' ? raw : decoded;
      const id = Number(String(s).trim());
      return Number.isFinite(id) && id > 0 ? id : null;
    } catch {
      return null;
    }
  }

  /** 123 → Base64("\"123\"") (부모용과 동일 포맷 유지) */
  private encodeAfterIdToCursor(id: number): string {
    const payload = JSON.stringify(String(id));
    return Buffer.from(payload, 'utf8').toString('base64');
  }

  private safeJsonParse(input: string): unknown {
    try {
      return JSON.parse(input);
    } catch {
      return input;
    }
  }

  /** Asia/Seoul yyyy-MM-dd (부모용과 동일 계산식) */
  private getTodayYmdKST(): string {
    const now = new Date();
    const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
    const kst = new Date(kstMs);
    const y = kst.getUTCFullYear();
    const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const d = String(kst.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
        status: q.status, // 'TODAY'
        question: q.question,
        hint: q.hint ?? undefined,
        // 정책: 미해결이면 reward 미포함(또는 null). 현재는 미포함 쪽으로 매핑.
        reward: q.isSolved ? q.reward ?? undefined : undefined,
        authorParentProfileId: q.authorParentProfileId,
        authorParentName: parent?.name ?? q.authorParentName ?? '부모',
        authorParentAvatarMediaId: parent?.avatarMediaId ?? q.authorParentAvatarMediaId ?? null,
        isSolved: q.isSolved,
      };
    });
  }
}
