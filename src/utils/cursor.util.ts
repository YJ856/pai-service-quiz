/**
 * 커서 기반 페이지네이션 유틸리티
 */

/**
 * 단순 ID 커서 디코딩
 * Base64("quizId") → number | null
 * 예: "MTIz" → 123
 */
export function decodeIdCursor(cursor: string | null): number | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    const raw = safeJsonParse(decoded);
    const s = typeof raw === 'string' ? raw : decoded;
    const id = Number(String(s).trim());
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

/**
 * 단순 ID 커서 인코딩
 * number → Base64("quizId")
 * 예: 123 → "MTIz"
 */
export function encodeIdCursor(id: number): string {
  const payload = JSON.stringify(String(id));
  return Buffer.from(payload, 'utf8').toString('base64');
}

/**
 * 복합 커서 디코딩 (날짜 + ID)
 * Base64("yyyy-MM-dd|quizId") → { publishDateYmd, quizId } | null
 * 예: "MjAyNS0xMC0xNnwxMjM=" → { publishDateYmd: "2025-10-16", quizId: 123 }
 */
export function decodeCompositeCursor(
  cursor: string | null
): { publishDateYmd: string; quizId: number } | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    const raw = safeJsonParse(decoded);
    const s = typeof raw === 'string' ? raw : decoded;
    const [ymd, idStr] = String(s).split('|');
    const quizId = Number(idStr);

    // 날짜 형식 검증
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    if (!Number.isFinite(quizId) || quizId <= 0) return null;

    return { publishDateYmd: ymd, quizId };
  } catch {
    return null;
  }
}

/**
 * 복합 커서 인코딩 (날짜 + ID)
 * { publishDateYmd, quizId } → Base64("yyyy-MM-dd|quizId")
 * 예: { publishDateYmd: "2025-10-16", quizId: 123 } → "MjAyNS0xMC0xNnwxMjM="
 */
export function encodeCompositeCursor(publishDateYmd: string, quizId: number): string {
  const payload = JSON.stringify(`${publishDateYmd}|${quizId}`);
  return Buffer.from(payload, 'utf8').toString('base64');
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
