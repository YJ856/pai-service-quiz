export interface ParentsTodayChildStatusDto {
  childProfileId: number;
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
  authorParentProfileId: number;
  authorParentName: string;
  authorParentAvatarMediaId: bigint | null;
  children: ParentsTodayChildStatusDto[];
}

export interface ParentsTodayResponseResult {
  items: ParentsTodayItemDto[];
  nextCursor: string | null;
  hasNext: boolean;
}
