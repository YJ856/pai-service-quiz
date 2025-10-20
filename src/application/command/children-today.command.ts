export class ChildrenTodayCommand {
    constructor(
        public readonly childProfileId: string,
        public readonly limit: number,
        public readonly cursor?: string,
    ) {}
}