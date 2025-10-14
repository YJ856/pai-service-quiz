import { Inject, Injectable } from '@nestjs/common';
import type { ParentsScheduledResponseData, ParentsScheduledItemDto } from 'pai-shared-types';

import type {
  ListParentsScheduledQuery,
  ListParentsScheduledUseCase,
} from '../port/in/list-parents-scheduled.usecase';

import { QUIZ_TOKENS } from '../../quiz.token';
import type {
  QuizParentsQueryRepositoryPort,
  FindParentsScheduledParams,
} from '../port/out/quiz-parents-query.repository.port';
import type { ProfileDirectoryPort, ParentProfileSummary } from '../port/out/profile-directory.port';

@Injectable()
export class ListParentsScheduledService implements ListParentsScheduledUseCase {
  constructor(
    @Inject(QUIZ_TOKENS.QuizParentsQueryRepositoryPort)
    private readonly repo: QuizParentsQueryRepositoryPort,
    @Inject(QUIZ_TOKENS.ProfileDirectoryPort)
    private readonly profiles: ProfileDirectoryPort,
  ) {}

  /**
   * 예정된 퀴즈(부모용)
   * - 정렬: publishDate ASC, quizId ASC
   * - 커서: Base64("\"yyyy-MM-dd|quizId\"")
   */
  async execute(params: ListParentsScheduledQuery): Promise<ParentsScheduledResponseData> {
    const { parentProfileId } = params;
    const limit = this.clampLimit(params.limit);
    const after = this.decodeCursor(params.cursor); // { publishDateYmd, quizId } | null

    // 1) DB 조회
    const findParams: FindParentsScheduledParams = {
      parentProfileId,
      limit,
      after: after ?? undefined,
    };
    const { items, hasNext } = await this.repo.findParentsScheduled(findParams);

    // 2) 부모 프로필(이름/아바타) 보강
    const parent = await this.getParentSafe(Number(parentProfileId));
    const merged = this.enrichWithParent(items, parent, Number(parentProfileId));

    // 3) nextCursor (ASC 정렬이므로 페이지의 마지막 아이템 기준)
    const tail = merged.length ? merged[merged.length - 1] : null;
    const nextCursor = hasNext && tail ? this.encodeCursor(tail.publishDate, tail.quizId) : null;

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
      const raw = this.safeJsonParse(decoded); // "\"2025-10-07|123\"" → "2025-10-07|123"
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

  private async getParentSafe(id: number): Promise<ParentProfileSummary | null> {
    try {
      if (!Number.isFinite(id)) return null;
      return await this.profiles.getParentProfile(id);
    } catch {
      return null;
    }
  }

  private enrichWithParent(
    rows: ParentsScheduledItemDto[],
    parent: ParentProfileSummary | null,
    requesterParentId: number,
  ): ParentsScheduledItemDto[] {
    return rows.map((q) => {
      const isEditable =
        q.status === 'SCHEDULED' && q.authorParentProfileId === requesterParentId;
      return {
        ...q,
        authorParentName: parent?.name ?? q.authorParentName ?? '부모',
        authorParentAvatarMediaId: parent?.avatarMediaId ?? q.authorParentAvatarMediaId ?? null,
        isEditable,
      };
    });
  }
}
