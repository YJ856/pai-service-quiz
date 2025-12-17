export class ParentsTodayQuizCommand {
  constructor(
    public readonly parentProfileId: number,
    public readonly limit: number,
    public readonly cursor?: string,
  ) {}
}
