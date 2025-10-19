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
  const v = Number(limit ?? defaultValue); // limit가 null 또는 undefined일 때는 defaultValue로 대체 + Number로 변환
  if (!Number.isFinite(v)) return defaultValue; // 유한한 숫자가 아니면 defaultValue
  if (v < min) return min;
  if (v > max) return max;
  return v;
}
