export interface AnswerQuizResponseResult {
  quizId: bigint; // 제출 대상 퀴즈 ID
  isSolved: boolean; // 정답 여부
  reward?: string; // 정답 시에만 반환되는 보상 오답이면(undefined)
}
