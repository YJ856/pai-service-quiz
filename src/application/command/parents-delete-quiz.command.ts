export class ParentsDeleteQuizCommand {
  constructor (
    public readonly parentProfileId: number,
    public readonly quizId: bigint,
  ) {}
}
