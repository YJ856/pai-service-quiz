import type { UpdateQuizRequestDto } from 'pai-shared-types';

/**
 * 부모용 퀴즈 수정 UseCase
 * - 예정(SCHEDULED) 상태에서만 수정 가능
 * - 작성자 본인만 수정 가능
 * - 전달된 필드만 부분 수정 (hint/reward = null 이면 제거)
 */
export interface UpdateQuizCommand {
  quizId: number; // Path param: 수정 대상 퀴즈 ID 
  parentProfileId: string; // 가드에서 주입된 부모 프로필 ID (string으로 들어옴)
  patch: UpdateQuizRequestDto; // 수정 내용 (부분 수정) 
}

export interface UpdateQuizUseCase {
  execute(cmd: UpdateQuizCommand): Promise<void>;
}
