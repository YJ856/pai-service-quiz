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
  // props = 새로 만들 때 필요한 최소 입력(식별자/시간 없음)
  static create(props: {
    parentProfileId: number;
    question: string;
    answer: string;
    publishDate: PublishDate;
    hint?: string | null;
    reward?: string | null;
  }): Quiz {
    const question = props.question?.trim(); // 공백 검사
    const answer = props.answer?.trim();
    if (!question) throw new Error('EMPTY_QUESTION');
    if (!answer) throw new Error('EMPTY_ANSWER');
    if (props.parentProfileId <= 0)
      throw new Error('INVALID_PARENT_PROFILE_ID');

    return new Quiz(
      null,
      props.parentProfileId,
      question,
      answer,
      props.publishDate,
      props.hint ?? null,
      props.reward ?? null,
    );
  }

  // DB -> 도메인 복원
  // DB 등 영속 계층에서 읽은 데이터로 도메인 객체를 복원
  // 주로 조회 후 수정/저장 때 사용
  // snapshot = 저장소/캐시에서 읽어온 완전한 상태
  static rehydrate(snapshot: {
    id: bigint;
    parentProfileId: number;
    question: string;
    answer: string;
    publishDate: string;
    hint: string | null;
    reward: string | null;
  }): Quiz {
    return new Quiz(
      snapshot.id,
      snapshot.parentProfileId,
      snapshot.question,
      snapshot.answer,
      PublishDate.ofISO(snapshot.publishDate),
      snapshot.hint,
      snapshot.reward,
    );
  }

  // 제목/정답/힌트/보상/날짜 수정 - 최소 검증만
  changeQuestion(next: string): void {
    const trimmedQuestion = next?.trim();
    if (!trimmedQuestion) throw new Error('EMPTY_QUESTION');
    if (this._question === trimmedQuestion) return;
    this._question = trimmedQuestion;
  }
  changeAnswer(next: string): void {
    const trimmedAnswer = next?.trim();
    if (!trimmedAnswer) throw new Error('EMPTY_ANSWER');
    if (this._answer === trimmedAnswer) return;
    this._answer = trimmedAnswer;
  }
  changeHint(next?: string | null): void {
    const normalizedHint = next ?? null;
    if (this._hint === normalizedHint) return;
    this._hint = normalizedHint;
  }
  changeReward(next?: string | null): void {
    const normalizedReward = next ?? null;
    if (this._reward === normalizedReward) return;
    this._reward = normalizedReward;
  }
  reschedule(next: PublishDate): void {
    if (this._publishDate.ymd === next.ymd) return;
    this._publishDate = next;
  }

  // getter (조회 전용)
  getId(): bigint | null {
    return this._id;
  }
  getParentProfileId(): number {
    return this._parentProfileId;
  }
  getQuestion(): string {
    return this._question;
  }
  getAnswer(): string {
    return this._answer;
  }
  getPublishDate(): PublishDate {
    return this._publishDate;
  }
  getHint(): string | null {
    return this._hint;
  }
  getReward(): string | null {
    return this._reward;
  }
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
