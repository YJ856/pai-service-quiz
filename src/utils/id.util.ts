/** string|number → number (정수 변환 + 유효성 검사) */
export function toIntId(id: string | number, label = 'id'): number {
  const n = typeof id === 'string' ? Number(id) : id;
  if (!Number.isFinite(n)) throw new Error(`Invalid ${label}`);
  return n;
}
