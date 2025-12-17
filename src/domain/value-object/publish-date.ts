export class PublishDate {
  private constructor(readonly ymd: string) {}

  static ofISO(ymd: string) {
    // 생성 규칙: 이미 yyyy-MM-dd 문자열 상태
    // 엔티티에 주입될 때 형식 보장
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) throw new Error('INVALID_DATE');

    // 달력 유효성(2/30 등) 검증
    const date = new Date(`${ymd}T00:00:00.000Z`);
    const iso = date.toISOString().slice(0, 10);
    if (iso !== ymd) throw new Error('INVALID_DATE_VALUE');
    return new PublishDate(ymd);
  }

  // 유스케이스에서 사용
  static ofOnOrAfter(ymd: string, todayYmd: string) {
    const scheduledDate = PublishDate.ofISO(ymd);
    const todayDate = PublishDate.ofISO(todayYmd);
    if (scheduledDate.ymd < todayDate.ymd) throw new Error('DATE_IN_PAST');
    return scheduledDate;
  }

  // 동등성 제공
  equals(other: PublishDate): boolean {
    return !!other && this.ymd === other.ymd;
  }
}
