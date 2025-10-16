export const QUIZ_TOKENS = {
    // 통합 포트
    QuizQueryPort: Symbol('QuizQueryPort'),
    QuizCommandPort: Symbol('QuizCommandPort'),
    QuizStatusTransitionPort: Symbol('QuizStatusTransitionPort'),

    CreateQuizUseCase: Symbol('CreateQuizUseCase'),
    GetNextPublishDateUseCase: Symbol('GetNextPublishDateUseCase'),
    ListParentsTodayUseCase: Symbol('ListParentsTodayUseCase'),
    ListParentsCompletedUseCase: Symbol('ListParentsCompletedUseCase'),
    ListParentsScheduledUseCase: Symbol('ListParentsScheduledUseCase'),
    GetParentsQuizDetailUseCase: Symbol('GetParentsQuizDetailUseCase'),
    UpdateQuizUseCase: Symbol('UpdateQuizUseCase'),
    DeleteQuizUseCase: Symbol('DeleteQuizUseCase'),
    ListChildrenTodayUseCase: Symbol('ListChildrenTodayUseCase'),
    ListChildrenCompletedUseCase: Symbol('ListChildrenCompletedUseCase'),
    AnswerQuizUseCase: Symbol('AnswerQuizUseCase'),

    // 외부 User 서비스 포트(프로필 디렉터리)
    ProfileDirectoryPort: Symbol('ProfileDirectoryPort'),
};