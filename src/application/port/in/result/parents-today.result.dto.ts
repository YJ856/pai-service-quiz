export interface ParentsTodayChildStatusDto {
  childProfileId: bigint;
  childName: string;
  childAvatarMediaId: bigint | null;
  isSolved: boolean;
}

export interface ParentsTodayItemDto {
  quizId: bigint;
  question: string;
  answer: string;
  hint: string | null;
  reward: string | null;
  authorParentProfileId: bigint;
  authorParentName: string;
  authorParentAvatarMediaId: bigint | null;
  children: ParentsTodayChildStatusDto[];
}

export interface ParentsTodayResponseResult {
  items: ParentsTodayItemDto[];
  nextCursor: string | null;
  hasNext: boolean;
}
