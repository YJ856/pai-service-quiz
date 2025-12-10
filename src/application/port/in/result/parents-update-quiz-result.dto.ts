export interface UpdateQuizResponseResult {
  quizId: bigint;
  question: string;
  answer: string;
  hint: string | null;
  reward: string | null;
  publishDate: string;
  isEditable: boolean;
}
