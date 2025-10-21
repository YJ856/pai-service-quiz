export interface ParentsQuizDetailResponseResult {
  quizId: number;
  question: string;
  answer: string;
  hint: string | null;
  reward: string | null;
  publishDate: string;
  isEditable: boolean;
}
