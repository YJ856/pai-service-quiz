export interface GetNextPublishDateUseCase {
  /** returns 'yyyy-MM-dd' (KST) */
  execute(parentProfileId: number): Promise<string>;
}
