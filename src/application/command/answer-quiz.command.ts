export class AnswerQuizCommand {
    constructor(
        public readonly quizId: bigint,
        public readonly childProfileId: bigint,
        public readonly answer: string,
    ) {}
}