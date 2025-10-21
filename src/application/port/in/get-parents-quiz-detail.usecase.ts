import type { ParentsQuizDetailResponseData } from 'pai-shared-types';
import type { DetailQuizCommand } from '../../command/detail-quiz.command';

/**
 * 부모용 퀴즈 상세 조회 UseCase
 * - 작성자 본인 확인 + 상세 데이터 반환
 */
export interface GetParentsQuizDetailUseCase {
  execute(cmd: DetailQuizCommand): Promise<ParentsQuizDetailResponseData>;
}
