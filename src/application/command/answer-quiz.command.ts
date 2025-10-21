export class AnswerQuizCommand {
    constructor(
        public readonly quizId: number,
        public readonly childProfileId: number,
        public readonly answer: string,
    ) {}
}