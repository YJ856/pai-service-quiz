export class ParentsGrantRewardCommand {
    constructor (
        public readonly quizId: bigint,
        public readonly childProfileId: number,
        public readonly grant: boolean,
    ) {}
}