import type { Quiz } from '../../../domain/model/quiz';

// 수정 ========================================================

export type QuizUpdateRepoPatch = {
  question?: string;
  answer?: string;
  hint?: string | null;
  reward?: string | null;
  publishDate?: Date;
};

export type UpdateRewardGranted = {
  quizId: bigint;
  childProfileId: number;
  rewardGranted: boolean;
};

// 정답 처리 =====================================================

export interface MarkSolvedParams {
  childProfileId: number;
  quizId: bigint;
}

// 통합 쓰기 포트 ================================================

export interface QuizCommandPort {
  // 생성
  save(quiz: Quiz): Promise<Quiz>;

  // 조회 (쓰기 작업 전 필요한 경우)
  findById(id: bigint): Promise<Quiz | null>;

  // 수정
  updateIfScheduledAndAuthor(params: {
    quizId: bigint;
    parentProfileId: number;
    patch: QuizUpdateRepoPatch;
  }): Promise<number>;

  updateRewardGranted(params: UpdateRewardGranted): Promise<boolean>;

  // 삭제
  deleteIfScheduledAndAuthor(params: {
    quizId: bigint;
    parentProfileId: number;
  }): Promise<number>;

  // 정답 처리
  markSolved(params: MarkSolvedParams): Promise<void>;
}
