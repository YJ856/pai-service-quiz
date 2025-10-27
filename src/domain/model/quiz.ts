
import { PublishDate } from '../value-object/publish-date';

export class Quiz {
    private constructor(
        private _id: bigint | null, // 언더바 사용? -> 캡슐화 표식: “이건 내부 상태고, 직접 건드리지 말고 메서드/게터로 접근해”라는 신호
        private _parentProfileId: number,
        private _question: string,
        private _answer: string,
        private _publishDate: PublishDate,
        private _hint: string | null,
        private _reward: string | null,
    ) {}
    
    // 새 퀴즈 생성
    static create(args: {
        parentProfileId: number;
        question: string;
        answer: string;
        publishDate: string;
        hint?: string | null;
        reward?: string | null;
    }): Quiz {
        const q = args.question?.trim(); // 공백 검사
        const a = args.answer?.trim();
        if (!q) throw new Error('EMPTY_QUESTION');
        if (!a) throw new Error('EMPTY_ANSWER');

        return new Quiz(
            null,
            args.parentProfileId,
            q,
            a,
            PublishDate.ofISO(args.publishDate), // 날짜 형식 보증
            args.hint ?? null,
            args.reward ?? null,
        );
    }

    // DB -> 도메인 복원
    // DB 등 영속 계층에서 읽은 데이터로 도메인 객체를 복원
    // 주로 조회 후 수정/저장 때 사용
    static rehydrate(p: {
        id: bigint;
        parentProfileId: number,
        question: string;
        answer: string;
        publishDate: string;
        hint: string | null;
        reward: string | null;
    }): Quiz {
        return new Quiz(
            p.id,
            p.parentProfileId,
            p.question,
            p.answer,
            PublishDate.ofISO(p.publishDate),
            p.hint,
            p.reward,
        );
    }

    // 제목/정답/힌트/보상/날짜 수정 - 최소 검증만
    changeQuestion(next: string) {
        const v = next?.trim();
        if (!v) throw new Error('EMPTY_QUESTION');
        this._question = v;
    }
    changeAnswer(next: string) {
        const v = next?.trim();
        if (!v) throw new Error('EMPTY_ANSWER');
        this._answer = v;
    }
    changeHint(next: string | null | undefined) {
        this._hint = (next ?? null);
    }
    changeReward(next: string | null | undefined) {
        this._reward = (next ?? null);
    }
    reschedule(next: PublishDate) {
        this._publishDate = next;
    }

    // getter (조회 전용)
    get id() { return this._id; }
    get parentProfileId() { return this._parentProfileId; }
    get question() { return this._question; }
    get answer() { return this._answer; }
    get publishDate() { return this._publishDate; }
    get hint() { return this._hint; }
    get reward() { return this._reward; }
}


/** 상태 전이 = 엔티티 내부 상태가 어떤 행동(메서드)을 통해 이전값 -> 이후값으로 바뀌는 것
 * 이때 전이가 일어날 때마다 불변식(지켜야 할 규칙)을 함께 검사
 * 불변식 = 엔티티가 언제나(전/후) 만족해야 하는 도메인의 규칙
 */

/** HTTP로 보면 POST/PATCH/DELETE처럼 상태가 바뀌는 요청에 대응하는 규칙이 엔티티 메서드(상태 전이)로 들어가고,
 * GET처럼 조회만이면 엔티티 로직이 거의 필요 없음
 * 다만 중요한 포인트는 엔티티는 HTTP를 모른다는 것!
 * 엔티티는 상태 전이 + 불변식만 책임진다.
 */