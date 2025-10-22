export class DetailQuizCommand {
    constructor(
        public readonly quizId: bigint,
        public readonly parentProfileId: bigint,
    ) {}
}