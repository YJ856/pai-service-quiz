import type { ParentsQuizDetailResponseResult } from './result/parents-detail-quiz-result.dto';
import type { ParentsDetailQuizCommand } from '../../command/parents-detail-quiz.command';

/**
 * 부모용 퀴즈 상세 조회 UseCase
 * - 작성자 본인 확인 + 상세 데이터 반환
 */
export interface GetParentsQuizDetailUseCase {
  execute(cmd: ParentsDetailQuizCommand): Promise<ParentsQuizDetailResponseResult>;
}
