export interface ChildrenCompletedItemDto {
  quizId: bigint;
  publishDate: string; // yyyy-MM-dd (Asia/Seoul 기준)
  question: string;
  answer: string; 
  reward: string | null; // 완료 목록이므로 항상 노출 가능
  authorParentProfileId: number;
  authorParentName: string;
  authorParentAvatarMediaId: bigint | null;
}

export interface ChildrenCompletedResponseResult {
  items: ChildrenCompletedItemDto[]; // 최신순
  nextCursor: string | null; /** 다음 페이지 커서(Base64), 없으면 null */
  hasNext: boolean;
}
