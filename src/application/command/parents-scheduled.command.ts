export class ParentsScheduledCommand {
    constructor(
        public readonly parentProfileId: string,
        public readonly limit: number,
        public readonly cursor?: string,
    ) {}
}