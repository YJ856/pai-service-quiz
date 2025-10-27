export class ParentsCreateQuizCommand {
  constructor(
    public readonly parentProfileId: number,
    public readonly question: string,
    public readonly answer: string,
    public readonly hint: string | null,
    public readonly reward: string | null,
    public readonly publishDate: string | null,
  ) {}
}