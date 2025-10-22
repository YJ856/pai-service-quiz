export class DeleteQuizCommand {
  constructor (
    public readonly parentProfileId: bigint,
    public readonly quizId: bigint,
  ) {}
}
