export interface ParentsTodayChildStatusDto {
  childProfileId: number;
  childName: string;
  childAvatarMediaId: number | null;
  isSolved: boolean;
}

export interface ParentsTodayItemDto {
  quizId: number;
  question: string;
  answer: string;
  hint: string | null;
  reward: string | null;
  authorParentProfileId: number;
  authorParentName: string;
  authorParentAvatarMediaId: number | null;
  children: ParentsTodayChildStatusDto[];
}

export interface ParentsTodayResponseResult {
  items: ParentsTodayItemDto[];
  nextCursor: string | null;
  hasNext: boolean;
}
