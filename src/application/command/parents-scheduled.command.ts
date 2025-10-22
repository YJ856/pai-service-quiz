export class ParentsScheduledCommand {
    constructor(
        public readonly parentProfileId: bigint,
        public readonly limit: number,
        public readonly cursor?: string,
    ) {}
}