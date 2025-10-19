export class UpdateQuizCommand {
  constructor(
    public readonly quizId: number,
    public readonly parentProfileId: string | number,
    public readonly question?: string,
    public readonly answer?: string,
    public readonly hint?: string | null,
    public readonly reward?: string | null,
    public readonly publishDate?: string,
  ) {}
}


