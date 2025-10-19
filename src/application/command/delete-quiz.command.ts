export class DeleteQuizCommand {
  constructor (
    public readonly quizId: number,
    public readonly parentProfileId: number,
  ) {
    // 이유: 삭제는 PK 두 개만 믿고 가는 연산이라 양의 정수 보장 + 불변만 챙기면 끝
    if (!Number.isInteger(quizId) || quizId <= 0) throw new Error('quizId invalid');
    if (!Number.isInteger(parentProfileId) || parentProfileId <= 0) throw new Error('parentProfileId invalid');
    Object.freeze(this);
  }
}
