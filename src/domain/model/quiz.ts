/**
 * Quiz 도메인 엔티티 (순수 데이터 구조)
 *
 * 엔티티는 비즈니스 로직을 포함하지 않고, 단순히 데이터 구조만 표현
 * 검증 로직은 서비스 레이어에서, 상태/정책 로직은 quiz.policy.ts에서 처리
 */
export class Quiz {
    constructor(
        public question: string,
        public answer: string,
        public publishDate: string, // yyyy-MM-dd(문자열)
        public authorParentProfileId: bigint,
        public hint?: string | null,
        public reward?: string | null,
        public id?: bigint, // 저장 전엔 없음, 저장 후 채워짐
    ) {}
}