/**
 * PATCH용 레포지토리 포트
 * - 부분 수정(질문/정답/힌트/보상/발행일)
 * - DB 단에서 "작성자 + SCHEDULED" 조건을 함께 보장하여 경합에 안전
 */

export type QuizUpdateRepoPatch = {
  question?: string; // 질문: undefined면 변경 없음 
  answer?: string; // 정답: undefined면 변경 없음 
  hint?: string | null; // 힌트: null -> 제거, undefined -> 변경 없음
  reward?: string | null; // 보상: null -> 제거, undefined -> 변경 없음 
  /**
   * 발행일: Date로 정규화된 값
   * - undefined면 변경 없음
   * - null은 허용하지 않음(항상 존재해야 하는 비즈니스 필드)
   */
  publishDate?: Date;
};

export interface QuizUpdateRepositoryPort {
  /**
   * 작성자 + SCHEDULED 조건을 만족하는 단건만 부분 수정
   * - 조건: where id = quizId AND parentProfileId = authorParentProfileId AND status = 'SCHEDULED'
   * - 반환: 실제로 갱신된 레코드 수(0 또는 1)
   *   - 0이면: 대상 없음(미존재/작성자 아님/상태 불일치)
   */
  updateIfScheduledAndAuthor(params: {
    quizId: number;
    authorParentProfileId: number;
    patch: QuizUpdateRepoPatch;
  }): Promise<number>;
}
