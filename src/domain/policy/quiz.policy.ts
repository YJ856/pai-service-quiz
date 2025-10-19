/**
 * 퀴즈 도메인 정책 모듈 (Single Source of Truth)
 *
 * 모든 퀴즈 상태 계산 및 권한 판단 로직의 정답지.
 * 다른 레이어(서비스, 매퍼, 리포지토리)는 이 정책을 호출만 함.
 */

export type QuizStatus = 'SCHEDULED' | 'TODAY' | 'COMPLETED';

/**
 * publishDate 기반으로 퀴즈 상태를 계산 (정책 정의)
 *
 * @param publishDate - 'yyyy-MM-dd' 형식의 퀴즈 발행일
 * @param todayKst - 'yyyy-MM-dd' 형식의 오늘 날짜 (KST 기준)
 * @returns 계산된 퀴즈 상태
 *
 * 규칙:
 * - publishDate > todayKst → SCHEDULED (예정)
 * - publishDate = todayKst → TODAY (오늘)
 * - publishDate < todayKst → COMPLETED (완료)
 */
export function deriveStatus(publishDate: string, todayKst: string): QuizStatus {
  if (publishDate > todayKst) return 'SCHEDULED';
  if (publishDate === todayKst) return 'TODAY';
  return 'COMPLETED';
}

/**
 * 퀴즈 수정 가능 여부 판단 (정책 정의)
 *
 * @param publishDate - 'yyyy-MM-dd' 형식의 퀴즈 발행일
 * @param authorParentProfileId - 퀴즈 작성자 프로필 ID
 * @param requesterId - 요청자 프로필 ID
 * @param todayKst - 'yyyy-MM-dd' 형식의 오늘 날짜 (KST 기준)
 * @returns 수정 가능하면 true, 아니면 false
 *
 * 규칙:
 * - 작성자만 수정 가능
 * - SCHEDULED 상태(publishDate > todayKst)일 때만 수정 가능
 */
export function canEdit(
  publishDate: string,
  authorParentProfileId: number | string,
  requesterId: number | string,
  todayKst: string,
): boolean {
  // 작성자가 아니면 불가
  if (String(authorParentProfileId) !== String(requesterId)) {
    return false;
  }

  // SCHEDULED 상태일 때만 가능
  const status = deriveStatus(publishDate, todayKst);
  return status === 'SCHEDULED';
}

/**
 * 퀴즈 삭제 가능 여부 판단 (정책 정의)
 *
 * @param publishDate - 'yyyy-MM-dd' 형식의 퀴즈 발행일
 * @param authorParentProfileId - 퀴즈 작성자 프로필 ID
 * @param requesterId - 요청자 프로필 ID
 * @param todayKst - 'yyyy-MM-dd' 형식의 오늘 날짜 (KST 기준)
 * @returns 삭제 가능하면 true, 아니면 false
 *
 * 규칙:
 * - 작성자만 삭제 가능
 * - SCHEDULED 상태(publishDate > todayKst)일 때만 삭제 가능
 */
export function canDelete(
  publishDate: string,
  authorParentProfileId: number | string,
  requesterId: number | string,
  todayKst: string,
): boolean {
  // 수정/삭제 정책은 동일
  return canEdit(publishDate, authorParentProfileId, requesterId, todayKst);
}

/**
 * 퀴즈가 편집 가능한지 여부 (DTO 응답용)
 *
 * @param publishDate - 'yyyy-MM-dd' 형식의 퀴즈 발행일
 * @param authorParentProfileId - 퀴즈 작성자 프로필 ID
 * @param viewerId - 현재 조회자 프로필 ID
 * @param todayKst - 'yyyy-MM-dd' 형식의 오늘 날짜 (KST 기준)
 * @returns 편집 가능하면 true, 아니면 false
 */
export function isEditable(
  publishDate: string,
  authorParentProfileId: number | string,
  viewerId: number | string,
  todayKst: string,
): boolean {
  return canEdit(publishDate, authorParentProfileId, viewerId, todayKst);
}
