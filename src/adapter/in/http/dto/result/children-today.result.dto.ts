export interface ChildrenTodayItemDto {
  quizId: number;
  question: string;
  hint: string | null;
  reward: string | null;
  authorParentProfileId: number;
  authorParentName: string;
  authorParentAvatarMediaId: number | null; // 항상 키는 주되, 아바타 없으면 null을 보내 일관된 키셋 유지
  isSolved: boolean; // 내가 풀었는지
}

export interface ChildrenTodayResponseResult {
  items: ChildrenTodayItemDto[];
  nextCursor: string | null; // 다음 페이지 커서(Base64)
  hasNext: boolean;
}
