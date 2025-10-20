export class ChildrenCompletedCommand {
    constructor(
        public readonly childProfileId: string,
        public readonly limit: number,
        public readonly cursor?: string,
    ) {}
}