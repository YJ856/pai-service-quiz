export class DetailQuizCommand {
    constructor(
        public readonly quizId: string,
        public readonly parentProfileId: string,
    ) {}
}