/**
 * 상세 조회에 필요한 최소 필드(Prisma에서 그대로 끌고 오도록 설계)
 * - publishDate: DB가 @db.Date 이므로 Date로 받고, 서비스에서 'yyyy-MM-dd'로 포맷
 * - parentProfileId: 작성자 식별/권한 확인용
 * - status: SCHEDULED/TODAY/COMPLETED — 편집 가능 여부 판단에 필요
 */
export type QuizDetailRow = {
  id: number;
  question: string;
  answer: string;
  hint: string | null;
  reward: string | null;
  publishDate: Date;          // @db.Date
  parentProfileId: number;    // 작성자
  status: 'SCHEDULED' | 'TODAY' | 'COMPLETED';
};

export interface QuizDetailQueryRepositoryPort {
  findById(quizId: number): Promise<QuizDetailRow | null>; // 퀴즈 단건 조회 - 존재하지 않으면 null
}
