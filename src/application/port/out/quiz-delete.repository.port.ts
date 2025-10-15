export interface QuizDeleteRepositoryPort {
  /**
   * 하드 삭제(완전 삭제).
   * 작성자(parentProfileId) & 상태 SCHEDULED 조건이 모두 만족할 때만 삭제한다.
   * @returns 영향 받은 행 수(0 또는 1)
   */
  deleteIfScheduledAndAuthor(params: {
    quizId: number;
    parentProfileId: number;
  }): Promise<number>;
}
