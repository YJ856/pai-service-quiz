export class DeleteQuizCommand {
  constructor (
    public readonly parentProfileId: string,
    public readonly quizId: string,
  ) {}
}
