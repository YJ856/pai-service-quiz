export class AnswerQuizCommand {
    constructor(
        public readonly quizId: string,
        public readonly childProfileId: string,
        public readonly answer: string,
    ) {}
}