export const QUIZ_TOKENS = {
    // 통합 포트
    QuizQueryPort: Symbol('QuizQueryPort'),
    QuizCommandPort: Symbol('QuizCommandPort'),
    ProfileDirectoryPort: Symbol('ProfileDirectoryPort'), // 외부 User 서비스 포트(프로필 디렉터리)
    TokenVersionQueryPort: Symbol('TokenVersionQueryPort'), // 토큰 버전 조회 포트

    // 부모
    GetNextPublishDateUseCase: Symbol('GetNextPublishDateUseCase'),
    GetParentsQuizDetailUseCase: Symbol('GetParentsQuizDetailUseCase'),
    ListParentsTodayUseCase: Symbol('ListParentsTodayUseCase'),
    ListParentsCompletedUseCase: Symbol('ListParentsCompletedUseCase'),
    ListParentsScheduledUseCase: Symbol('ListParentsScheduledUseCase'),

    CreateQuizUseCase: Symbol('CreateQuizUseCase'),
    UpdateQuizUseCase: Symbol('UpdateQuizUseCase'),
    DeleteQuizUseCase: Symbol('DeleteQuizUseCase'),
    GrantRewardUseCase: Symbol('GrantRewardUseCase'),
    
    // 아이
    ListChildrenTodayUseCase: Symbol('ListChildrenTodayUseCase'),
    ListChildrenCompletedUseCase: Symbol('ListChildrenCompletedUseCase'),
    AnswerQuizUseCase: Symbol('AnswerQuizUseCase'),

};