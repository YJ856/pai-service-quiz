/**
 * Quiz 상태 전환 포트
 * 일일 상태 전환 로직을 위한 outbound port
 */
export interface QuizStatusTransitionPort {
  /**
   * 오늘 출제 예정인 SCHEDULED 퀴즈를 TODAY로 전환
   * @param todayYmd 'yyyy-MM-dd' 형식의 오늘 날짜
   * @returns 전환된 퀴즈 개수
   */
  transitionScheduledToToday(todayYmd: string): Promise<number>;

  /**
   * 오늘보다 이전인 SCHEDULED/TODAY 퀴즈를 COMPLETED로 전환
   * @param todayYmd 'yyyy-MM-dd' 형식의 오늘 날짜
   * @returns 전환된 퀴즈 개수
   */
  transitionPastToCompleted(todayYmd: string): Promise<number>;
}
