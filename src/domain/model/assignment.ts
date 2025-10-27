
export class Assignment {
  private constructor(
    private _id: bigint | null,
    private _quizId: bigint,
    private _childProfileId: number,
    private _isSolved: boolean,
    private _rewardGranted: boolean,
  ) {}

  // 새 배정 생성
  static create(args: { quizId: bigint; childProfileId: number}) : Assignment {
    return new Assignment(null, args.quizId, args.childProfileId, false, false);
  }

  // DB -> 도메인 복원
  static rehydrate(p: {
    id: bigint;
    quizId: bigint;
    childProfileId: number;
    isSolved: boolean;
    rewardGranted: boolean;
  }): Assignment {
    return new Assignment(p.id, p.quizId, p.childProfileId, p.isSolved, p.rewardGranted);
  }

  // 정답 처리
  markSolved() {
    if (!this._isSolved) this._isSolved = true;
  }

  // 보상 지급: 풀었을 때만, 중복 지급 금지
  grantReward() {
    if (!this._isSolved) throw new Error('REWARD_BEFORE_SOLVED');
    if (!this._rewardGranted) this._rewardGranted = true;
  }

  // 조회 전용 getter
  get id() { return this._id; }
  get quizId() { return this._quizId; }
  get childProfileId() { return this._childProfileId; }
  get isSolved() { return this._isSolved };
  get rewardGranted() { return this._rewardGranted; }
}