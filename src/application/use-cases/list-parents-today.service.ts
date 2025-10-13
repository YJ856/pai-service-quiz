import { Inject, Injectable } from '@nestjs/common';
import type {
  ParentsTodayResponseData,
  ParentsTodayItemDto,
} from 'pai-shared-types';

import type {
  ListParentsTodayQuery,
  ListParentsTodayUseCase,
} from '../port/in/list-parents-today.usecase';

import { QUIZ_TOKENS } from '../../quiz.token';
import type { QuizParentsQueryRepositoryPort } from '../port/out/quiz-parents-query.repository.port';
import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
  ChildProfileSummary,
} from '../port/out/profile-directory.port';

@Injectable()
export class ListParentsTodayService implements ListParentsTodayUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizParentsQueryRepositoryPort)
    private readonly repo: QuizParentsQueryRepositoryPort,

    // 외부 User 서비스 포트 주입
    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  /**
   * 오늘의 퀴즈(부모용)
   * - 기준 날짜: Asia/Seoul(UTC+9)
   * - 커서: Base64("quizId")
   */
  async execute(params: ListParentsTodayQuery): Promise<ParentsTodayResponseData> {
    const { parentProfileId } = params;
    const limit = this.clampLimit(params.limit);
    const afterQuizId = this.decodeCursorToAfterId(params.cursor);

    const todayYmd = this.getTodayYmdKST();

    // 1) DB에서 기본 목록
    const { items, hasNext } = await this.repo.findParentsToday({
      parentProfileId,
      todayYmd,
      limit,
      afterQuizId: afterQuizId ?? undefined,
    });

    // 2) 프로필 정보 배치 조회
    const [parent, childMap] = await Promise.all([
      this.getParentSafe(Number(parentProfileId)),
      this.getChildrenSafe(this.collectChildIds(items)),
    ]);

    // 3) 응답에 프로필 정보 합치기
    const merged = this.enrichWithProfiles(items, parent, childMap);

    const nextCursor = hasNext
      ? this.encodeAfterIdToCursor(items[items.length - 1].quizId)
      : null;

    return {
      items: merged,
      nextCursor,
      hasNext,
    };
  }

  // ============== Helpers ==============

  private clampLimit(n: number): number {
    if (n < 1) return 1;
    if (n > 50) return 50;
    return n;
  }

  /** Base64("123") → 123  */
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

  /** 123 → Base64("\"123\"") */
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

  /** Asia/Seoul yyyy-MM-dd */
  private getTodayYmdKST(): string {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const y = kst.getUTCFullYear();
    const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const d = String(kst.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private collectChildIds(items: ParentsTodayItemDto[]): number[] {
    const set = new Set<number>();
    for (const it of items) for (const c of it.children) set.add(c.childProfileId);
    return Array.from(set);
  }

  private async getParentSafe(id: number): Promise<ParentProfileSummary | null> {
    try {
      if (!Number.isFinite(id)) return null;
      return await this.profiles.getParentProfile(id);
    } catch {
      return null;
    }
  }

  private async getChildrenSafe(ids: number[]): Promise<Record<number, ChildProfileSummary>> {
    try {
      return await this.profiles.getChildProfiles(ids);
    } catch {
      return {};
    }
  }

  /** DB rows + 외부 프로필을 합쳐 최종 DTO로 */
  private enrichWithProfiles(
    rows: ParentsTodayItemDto[],
    parent: ParentProfileSummary | null,
    childMap: Record<number, ChildProfileSummary>,
  ): ParentsTodayItemDto[] {
    return rows.map((q) => ({
      ...q,
      authorParentProfileId: q.authorParentProfileId,
      authorParentName: parent?.name ?? q.authorParentName ?? '부모',
      authorParentAvatarMediaId:
        parent?.avatarMediaId ?? q.authorParentAvatarMediaId ?? null,
      children: q.children.map((c) => {
        const info = childMap[c.childProfileId];
        return {
          ...c,
          childName: info?.name ?? c.childName ?? '',
          childAvatarMediaId:
            (info?.avatarMediaId ?? c.childAvatarMediaId ?? null),
        };
      }),
    }));
  }
}
