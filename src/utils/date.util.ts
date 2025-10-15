/**
 * 날짜 관련 유틸리티 함수 모음
 * - 모든 날짜는 'yyyy-MM-dd' 문자열 형식 사용
 * - Prisma @db.Date와 호환되도록 UTC 기준 Date 객체 사용
 * - 비즈니스 타임존(기본: Asia/Seoul) 기준 계산
 */

/**
 * 비즈니스 타임존(기본: Asia/Seoul) 기준 '오늘' 날짜를 'yyyy-MM-dd' 형식으로 반환
 * @returns 'yyyy-MM-dd' 형식의 오늘 날짜
 */
export function todayYmd(): string {
  const tz = process.env.BUSINESS_TZ || 'Asia/Seoul';
  // Intl로 타임존 기준 연-월-일을 안전하게 추출
  const fmt = new Intl.DateTimeFormat('en-CA', {
    // en-CA => YYYY-MM-DD 형식
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

/**
 * 'yyyy-MM-dd' 날짜에 1일을 더한 날짜를 'yyyy-MM-dd' 형식으로 반환
 * @param ymd 'yyyy-MM-dd' 형식의 날짜
 * @returns 다음 날짜 ('yyyy-MM-dd')
 */
export function plusOneYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return utcDateToYmd(dt);
}

/**
 * Date 객체(UTC 기준)를 'yyyy-MM-dd' 형식 문자열로 변환
 * @param dt Date 객체
 * @returns 'yyyy-MM-dd' 형식 문자열
 */
export function utcDateToYmd(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 'yyyy-MM-dd' 형식 문자열을 Date 객체(UTC 00:00:00)로 변환
 * @param ymd 'yyyy-MM-dd' 형식 문자열
 * @returns Date 객체 (UTC 기준)
 */
export function ymdToUtcDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

/**
 * 'yyyy-MM-dd' 형식 유효성 검증
 * @param s 검증할 문자열
 * @returns 유효하면 true, 아니면 false
 */
export function isValidYmd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  // 유효 날짜 체크 (예: 2025-02-31 방지)
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/**
 * 'yyyy-MM-dd' 형식 유효성을 체크하고, 유효하면 원본 문자열 반환, 아니면 undefined
 * @param ymd 검증할 날짜 문자열 (옵션)
 * @returns 유효하면 원본 문자열, 아니면 undefined
 */
export function toYmdOrUndefined(ymd?: string | null): string | undefined {
  if (!ymd) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return undefined;
  const y = +m[1],
    mo = +m[2],
    d = +m[3];
  // 달력 유효성 체크 (예: 2025-02-31 방지)
  const dt = new Date(Date.UTC(y, mo - 1, d));
  const ok =
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === d;
  return ok ? ymd : undefined;
}

/**
 * Date 객체를 'yyyy-MM-dd' 형식으로 변환 (utcDateToYmd의 별칭)
 * @param dt Date 객체
 * @returns 'yyyy-MM-dd' 형식 문자열
 */
export function toYmdFromDate(dt: Date): string {
  return utcDateToYmd(dt);
}

/** 'yyyy-MM-dd' → 해당 날짜의 UTC 경계 (gte/lt) */
export function utcDayRangeForYmd(ymd: string): { gte: Date; lt: Date } {
  const start = ymdToUtcDate(ymd);                 // 기존 함수 재사용
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { gte: start, lt: end };
}
