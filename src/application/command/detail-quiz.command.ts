export class DetailQuizCommand {
    constructor(
        public readonly quizId: number,
        public readonly parentProfileId: number,
    ) {}
}