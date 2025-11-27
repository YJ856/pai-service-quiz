/**
 * Token Version Query Port (읽기 전용)
 * - Token version 조회 작업만 담당
 */
export interface TokenVersionQueryPort {
  /**
   * 현재 Token version 조회
   * @param userId 사용자 ID
   * @returns 현재 version 번호 (없으면 0)
   */
  getVersion(userId: number): Promise<number>;
}
