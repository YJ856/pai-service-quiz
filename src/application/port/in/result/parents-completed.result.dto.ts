export interface ParentsCompletedChildResultDto {
  childProfileId: bigint;
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
  authorParentProfileId: bigint;
  authorParentName: string;
  authorParentAvatarMediaId: bigint | null;
  children: ParentsCompletedChildResultDto[];
}

export interface ParentsCompletedResponseResult {
  items: ParentsCompletedItemDto[];
  nextCursor: string | null;
  hasNext: boolean;
}
