/**
 * 페이지네이션 유틸리티
 */

/**
 * limit 값을 1~50 범위로 클램프
 * @param limit 입력 limit 값
 * @param defaultValue 기본값 (기본: 20)
 * @param min 최소값 (기본: 1)
 * @param max 최대값 (기본: 50)
 * @returns 클램프된 limit 값
 */
export function clampLimit(
  limit: number | undefined,
  defaultValue = 20,
  min = 1,
  max = 50
): number {
  const v = Number(limit ?? defaultValue);
  if (!Number.isFinite(v)) return defaultValue;
  if (v < min) return min;
  if (v > max) return max;
  return v;
}
