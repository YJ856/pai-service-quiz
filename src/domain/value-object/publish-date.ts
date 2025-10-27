export class PublishDate {
    private constructor(readonly ymd: string) {}

        // 생성 규칙: 이미 yyyy-MM-dd 문자열 상태
        // 엔티티에 주입될 때 형식 보장
        static ofISO(ymd: string) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) throw new Error('INVALID_DATE');
            return new PublishDate(ymd);
        }

}