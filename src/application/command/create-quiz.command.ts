
export class CreateQuizCommand {
  constructor(
    public readonly question: string,
    public readonly answer: string,
    public readonly hint: string | null,
    public readonly reward: string | null,
    public readonly authorParentProfileId: string,
    public readonly publishDate?: string,
  ) {
    if (!question) throw new Error('question required');
    if (!answer) throw new Error('answer required');
    Object.freeze(this); // 실수로 수정 방지(얕은 불변)
  }
}