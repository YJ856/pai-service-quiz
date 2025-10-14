export const QUIZ_TOKENS = {
    QuizRepositoryPort: Symbol('QuizRepositoryPort'),
    QuizQueryPort: Symbol('QuizQueryPort'),
    QuizParentsQueryRepositoryPort: Symbol('QuizParentsQueryRepositoryPort'),

    CreateQuizUseCase: Symbol('CreateQuizUseCase'),
    GetNextPublishDateUseCase: Symbol('GetNextPublishDateUseCase'),
    ListParentsTodayUseCase: Symbol('ListParentsTodayUseCase'),
    ListParentsCompletedUseCase: Symbol('ListParentsCompletedUseCase'),
    ListParentsScheduledUseCase: Symbol('ListParentsScheduledUseCase'),

    // 외부 User 서비스 포트(프로필 디렉터리)
    ProfileDirectoryPort: Symbol('ProfileDirectoryPort'),
};