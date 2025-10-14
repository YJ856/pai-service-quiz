import type { ParentsQuizDetailResponseData } from 'pai-shared-types';

/**
 * 부모용 퀴즈 상세 조회 UseCase
 * - 작성자 본인 확인 + 상세 데이터 반환
 */
export interface GetParentsQuizDetailQuery {
  quizId: number; // 상세 조회할 퀴즈 ID 
  parentProfileId: string; // 가드에서 주입된 부모 프로필 ID (문자열로 들어옴)
}

export interface GetParentsQuizDetailUseCase {
  execute(query: GetParentsQuizDetailQuery): Promise<ParentsQuizDetailResponseData>;
}
