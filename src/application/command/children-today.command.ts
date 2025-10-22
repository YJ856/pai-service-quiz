export class ChildrenTodayCommand {
    constructor(
        public readonly childProfileId: bigint,
        public readonly limit: number,
        public readonly cursor?: string,
    ) {}
}