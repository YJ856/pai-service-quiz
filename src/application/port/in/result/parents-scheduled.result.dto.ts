export interface ParentsScheduledItemDto {
  quizId: number;
  publishDate: string;
  question: string;
  answer: string;
  hint: string | null;
  reward: string | null;
  authorParentProfileId: number;
  authorParentName: string;
  authorParentAvatarMediaId: number | null;
  isEditable: boolean;
}

export interface ParentsScheduledResponseResult {
  items: ParentsScheduledItemDto[];
  nextCursor: string | null;
  hasNext: boolean;
}
