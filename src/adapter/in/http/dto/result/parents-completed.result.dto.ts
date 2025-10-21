export interface ParentsCompletedChildResultDto {
  childProfileId: number;
  childName: string;
  childAvatarMediaId: string | null;
  isSolved: boolean;
  rewardGranted: boolean;
}

export interface ParentsCompletedItemDto {
  quizId: number;
  publishDate: string;
  question: string;
  answer: string;
  reward: string | null;
  authorParentProfileId: number;
  authorParentName: string;
  authorParentAvatarMediaId: number | null;
  children: ParentsCompletedChildResultDto[];
}

export interface ParentsCompletedResponseResult {
  items: ParentsCompletedItemDto[];
  nextCursor: string | null;
  hasNext: boolean;
}
