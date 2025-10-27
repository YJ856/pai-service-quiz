export class ChildrenCompletedQuizCommand {
    constructor(
        public readonly childProfileId: number,
        public readonly limit: number,
        public readonly cursor?: string,
    ) {}
}