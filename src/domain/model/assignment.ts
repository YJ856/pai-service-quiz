export class Assignment {
  constructor(
    public quizId: bigint,
    public childProfileId: bigint,
    public isSolved: boolean,
    public rewardGranted: boolean,
    public id?: bigint, // 저장 전엔 없음, 저장 후 채워짐
  ) {}
}