export interface QuizQueryPort {
    // 예약(SCHEDULED) 중 가장 마지막 publish_date
    findLastScheduledDateYmd(parentProfileId: string): Promise<string | null>;

    // 해당 날짜에 퀴즈 존재 여부
    existsAnyOnDate(parentProfileId: string, ymd: string): Promise<boolean>;
}