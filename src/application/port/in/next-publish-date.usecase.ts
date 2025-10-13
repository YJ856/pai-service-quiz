export interface GetNextPublishDateUseCase {
  /** returns 'yyyy-MM-dd' (KST) */
  execute(parentProfileId: string): Promise<string>;
}
