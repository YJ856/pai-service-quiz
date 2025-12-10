export interface ParentsCompletedChildResultDto {
  childProfileId: number;
  childName: string;
  childAvatarMediaId: bigint | null;
  isSolved: boolean;
  rewardGranted: boolean;
}

export interface ParentsCompletedItemDto {
  quizId: bigint;
  publishDate: string;
  question: string;
  answer: string;
  reward: string | null;
  authorParentProfileId: number;
  authorParentName: string;
  authorParentAvatarMediaId: bigint | null;
  children: ParentsCompletedChildResultDto[];
}

export interface ParentsCompletedResponseResult {
  items: ParentsCompletedItemDto[];
  nextCursor: string | null;
  hasNext: boolean;
}
