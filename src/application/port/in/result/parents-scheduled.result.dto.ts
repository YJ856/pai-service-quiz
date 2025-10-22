export interface ParentsScheduledItemDto {
  quizId: bigint;
  publishDate: string;
  question: string;
  answer: string;
  hint: string | null;
  reward: string | null;
  authorParentProfileId: bigint;
  authorParentName: string;
  authorParentAvatarMediaId: bigint | null;
  isEditable: boolean;
}

export interface ParentsScheduledResponseResult {
  items: ParentsScheduledItemDto[];
  nextCursor: string | null;
  hasNext: boolean;
}
