
export class Assignment {
  private constructor(
    private _id: bigint | null,
    private _quizId: bigint,
    private _childProfileId: number,
    private _isSolved: boolean,
    private _rewardGranted: boolean,
  ) {}

  // 새 배정 생성
  static create(props: { quizId: bigint; childProfileId: number}) : Assignment {
    if (props.quizId <= 0n) throw new Error('INVALID_QUIZ_ID');
    if (props.childProfileId <= 0) throw new Error('INVALIDE_CHILD_PROFILE_ID');
    return new Assignment(null, props.quizId, props.childProfileId, false, false);
  }

  // DB -> 도메인 복원
  static rehydrate(snapshot: {
    id: bigint;
    quizId: bigint;
    childProfileId: number;
    isSolved: boolean;
    rewardGranted: boolean;
  }): Assignment {
    if (snapshot.id <= 0n) throw new Error('INVALID_ID');
    if (snapshot.quizId <= 0n) throw new Error('INVALID_QUIZ_ID');
    if (snapshot.childProfileId <= 0) throw new Error('INVALID_CHILD_PROFILE_ID');
    if (snapshot.rewardGranted && !snapshot.isSolved) {
      throw new Error('REWARD_WITHOUT_SOLVED_INCONSISTENT');
    }
    return new Assignment(snapshot.id, snapshot.quizId, snapshot.childProfileId, snapshot.isSolved, snapshot.rewardGranted);
  }

  // 정답 처리
  markSolved(): void {
    if (this._isSolved) return;
    this._isSolved = true;
  }

  // 보상 지급: 풀었을 때만, 중복 지급 금지
  grantReward(): void {
    if (!this._isSolved) throw new Error('REWARD_BEFORE_SOLVED');
    if (this._rewardGranted) return;
    this._rewardGranted = true;
  }

  // 조회 전용 getter
  getId(): bigint | null { return this._id; }
  getQuizId(): bigint { return this._quizId; }
  getChildProfileId(): number { return this._childProfileId; }
  getIsSolved(): boolean { return this._isSolved };
  getRewardGranted(): boolean { return this._rewardGranted; }
}