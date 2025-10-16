import type { Quiz } from '../../../domain/model/quiz';

// ============================================================
// 생성
// ============================================================

// ============================================================
// 수정
// ============================================================

export type QuizUpdateRepoPatch = {
  question?: string;
  answer?: string;
  hint?: string | null;
  reward?: string | null;
  publishDate?: Date;
};

// ============================================================
// 삭제
// ============================================================

// ============================================================
// 정답 처리
// ============================================================

export interface MarkSolvedParams {
  childProfileId: string;
  quizId: number;
}

// ============================================================
// 통합 쓰기 포트
// ============================================================

export interface QuizCommandPort {
  // 생성
  save(quiz: Quiz): Promise<Quiz>;

  // 조회 (쓰기 작업 전 필요한 경우)
  findById(id: number): Promise<Quiz | null>;
  findLastScheduledDateByFamily(parentProfileId: number | string): Promise<string | null>;

  // 수정
  updateIfScheduledAndAuthor(params: {
    quizId: number;
    ParentProfileId: number;
    patch: QuizUpdateRepoPatch;
  }): Promise<number>;

  // 삭제
  deleteIfScheduledAndAuthor(params: {
    quizId: number;
    parentProfileId: number;
  }): Promise<number>;

  // 정답 처리
  markSolved(params: MarkSolvedParams): Promise<void>;
}
