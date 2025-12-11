export class ParentsDetailQuizCommand {
  constructor(
    public readonly quizId: bigint,
    public readonly parentProfileId: number,
  ) {}
}
