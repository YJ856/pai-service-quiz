export class UpdateQuizCommand {
  constructor(
    public readonly quizId: string,
    public readonly parentProfileId: string,
    // 보내면 바뀜, 안 보내면 그대로 (null은 허용하지 않음)
    public readonly question?: string,
    public readonly answer?: string,
    // 보내면 바뀜, null이면 clear, 안 보내면 그대로
    public readonly hint?: string | null,
    public readonly reward?: string | null,
    // 정책에 따라: 보내면 바뀜, null 또는 안 보내면 그대로
    public readonly publishDate?: string | null,
  ) {}
}


