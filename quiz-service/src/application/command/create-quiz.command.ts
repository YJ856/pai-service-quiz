/**
 * 유즈케이스(CreateQuiz)가 받는 내부 입력 모델
 * - 외부 DTO/HTTP/프레임워크로부터 분리된 순수 데이터 컨테이너
 * - 값 정규화(트리밍/날짜파싱/널 처리)는 보통 Mapper에서 하고, 여기엔 '정리된 값'만 들어옴
 */

export class CreateQuizCommand {
    constructor(
        public readonly question: string, // 질문(필수, 공백 제거된 문자열)
        public readonly answer: string, // 정답(필수, 공백 제거된 문자열)
        public readonly hint: string | null, // 힌트(옵션, 없으면 null)
        public readonly reward: string | null, // 보상(옵션, 없으면 null)
        public readonly authorParentProfileId: string | number, // 작성자(부모) 프로필 ID (필수)
        public readonly publishDate?: string, // 출제일(옵션) 
            // - 없으면 유즈케이스에서 '가족 퀴즈의 마지막 예정일 +1일'로 계산
            // - 있는 경우, yyyy-MM-dd를 문자열 그대로 전달(형식 유효성은 Mapper/Domain에서 검증)
    ) {}
}