export class ParentsScheduledCommand {
    constructor(
        public readonly parentProfileId: number,
        public readonly limit: number,
        public readonly cursor?: string,
    ) {}
}