/**
 * 커서 기반 페이지네이션 유틸리티
 */

/**
 * 단순 ID 커서 디코딩
 * Base64("quizId") → bigint | null
 * 예: "MTIz" → 123n
 */
export function decodeIdCursor(cursor: string | null): bigint | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    const raw = safeJsonParse(decoded);
    const s = typeof raw === 'string' ? raw : decoded;
    const idStr = String(s).trim();

    // 숫자 형식인지 검증
    if (!/^\d+$/.test(idStr)) return null;

    const id = BigInt(idStr);
    return id > 0n ? id : null;
  } catch {
    return null;
  }
}

/**
 * 단순 ID 커서 인코딩
 * number | bigint → Base64("quizId")
 * 예: 123n → "MTIz"
 */
export function encodeIdCursor(id: number | bigint): string {
  const payload = JSON.stringify(String(id));
  return Buffer.from(payload, 'utf8').toString('base64');
}

/**
 * 복합 커서 디코딩 (날짜 + ID)
 * Base64("yyyy-MM-dd|quizId") → { publishDateYmd, quizId } | null
 * 예: "MjAyNS0xMC0xNnwxMjM=" → { publishDateYmd: "2025-10-16", quizId: 123n }
 */
export function decodeCompositeCursor(
  cursor: string | null
): { publishDateYmd: string; quizId: bigint } | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    const raw = safeJsonParse(decoded);
    const s = typeof raw === 'string' ? raw : decoded;
    const [ymd, idStr] = String(s).split('|');

    // 날짜 형식 검증
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    if (!idStr || !/^\d+$/.test(idStr)) return null;

    const quizId = BigInt(idStr);
    if (quizId <= 0n) return null;

    return { publishDateYmd: ymd, quizId };
  } catch {
    return null;
  }
}

/**
 * 복합 커서 인코딩 (날짜 + ID)
 * { publishDateYmd, quizId } → Base64("yyyy-MM-dd|quizId")
 * 예: { publishDateYmd: "2025-10-16", quizId: 123n } → "MjAyNS0xMC0xNnwxMjM="
 */
export function encodeCompositeCursor(publishDateYmd: string, quizId: bigint | number): string {
  const payload = JSON.stringify(`${publishDateYmd}|${quizId.toString()}`);
  return Buffer.from(payload, 'utf8').toString('base64');
}

/**
 * Query parameter cursor를 안전하게 파싱
 * - 빈 문자열이면 null 반환
 * - trim 처리
 * @param cursor Query parameter로 받은 cursor (string | null | undefined)
 * @returns 유효한 cursor 문자열 또는 null
 */
export function parseCursorParam(cursor: string | null | undefined): string | null {
  if (!cursor) return null;
  const trimmed = String(cursor).trim();
  return trimmed !== '' ? trimmed : null;
}

/**
 * 안전한 JSON 파싱
 */
function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}
