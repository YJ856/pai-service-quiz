import { Inject, Injectable } from '@nestjs/common';
import type {
  ParentsCompletedResponseData,
  ParentsCompletedItemDto,
} from 'pai-shared-types';

import type {
  ListParentsCompletedQuery,
  ListParentsCompletedUseCase,
} from '../port/in/list-parents-completed.usecase';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizParentsQueryRepositoryPort,
  FindParentsCompletedParams,
} from '../port/out/quiz-parents-query.repository.port';

import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
  ChildProfileSummary,
} from '../port/out/profile-directory.port';

@Injectable()
export class ListParentsCompletedService implements ListParentsCompletedUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizParentsQueryRepositoryPort)
    private readonly repo: QuizParentsQueryRepositoryPort,

    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  /**
   * 완료된 퀴즈(부모용)
   * - 정렬: publishDate DESC, quizId DESC
   * - 커서: Base64("\"yyyy-MM-dd|quizId\"")
   */
  async execute(params: ListParentsCompletedQuery): Promise<ParentsCompletedResponseData> {
    const { parentProfileId } = params;
    const limit = this.clampLimit(params.limit);
    const after = this.decodeCursor(params.cursor); // { publishDateYmd, quizId } | null

    // 1) DB 조회
    const findParams: FindParentsCompletedParams = {
      parentProfileId,
      limit,
      after: after ?? undefined,
    };
    const { items, hasNext } = await this.repo.findParentsCompleted(findParams);

    // 2) 프로필 정보 배치 조회
    const [parent, childMap] = await Promise.all([
      this.getParentSafe(Number(parentProfileId)),
      this.getChildrenSafe(this.collectChildIds(items)),
    ]);

    // 3) 프로필 정보 합치기
    const merged = this.enrichWithProfiles(items, parent, childMap);

    // 4) nextCursor (DESC 정렬이므로 "페이지의 마지막 아이템" 기준)
    const tail = merged.length ? merged[merged.length - 1] : null;
    const nextCursor =
      hasNext && tail
        ? this.encodeCursor(tail.publishDate, tail.quizId)
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

  /** "Base64(\"yyyy-MM-dd|quizId\")" → { publishDateYmd, quizId } | null */
  private decodeCursor(cursor: string | null): { publishDateYmd: string; quizId: number } | null {
    if (!cursor) return null;
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      const raw = this.safeJsonParse(decoded); // "\"2025-10-03|101\"" → "2025-10-03|101"
      const s = typeof raw === 'string' ? raw : decoded;
      const [ymd, idStr] = String(s).split('|');
      const id = Number(idStr);
      if (!this.isValidYmd(ymd) || !Number.isFinite(id)) return null;
      return { publishDateYmd: ymd, quizId: id };
    } catch {
      return null;
    }
  }

  /** { ymd, id } → Base64("\"yyyy-MM-dd|quizId\"") */
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

  private isValidYmd(ymd: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(ymd);
  }

  private collectChildIds(items: ParentsCompletedItemDto[]): number[] {
    const set = new Set<number>();
    for (const it of items) {
      for (const c of it.children) set.add(c.childProfileId);
    }
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
    rows: ParentsCompletedItemDto[],
    parent: ParentProfileSummary | null,
    childMap: Record<number, ChildProfileSummary>,
  ): ParentsCompletedItemDto[] {
    return rows.map((q) => ({
      ...q,
      authorParentName: parent?.name ?? q.authorParentName ?? '부모',
      authorParentAvatarMediaId:
        parent?.avatarMediaId ?? q.authorParentAvatarMediaId ?? null,
      children: q.children.map((c) => {
        const info = childMap[c.childProfileId];
        return {
          ...c,
          childName: info?.name ?? c.childName ?? '',
          childAvatarMediaId: info?.avatarMediaId ?? c.childAvatarMediaId ?? null,
        };
      }),
    }));
  }
}
