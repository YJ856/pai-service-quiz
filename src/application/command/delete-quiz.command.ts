export interface DeleteQuizCommand {
  /** 삭제 대상 퀴즈 ID */
  quizId: number;
  /** 작성자 본인 확인용 부모 프로필 ID */
  parentProfileId: number;
}
