export class DeleteQuizCommand {
  constructor (
    public readonly parentProfileId: number,
    public readonly quizId: number,
  ) {}
}
