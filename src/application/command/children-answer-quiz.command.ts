export class ChildrenAnswerQuizCommand {
  constructor(
    public readonly quizId: bigint,
    public readonly childProfileId: number,
    public readonly answer: string,
  ) {}
}
