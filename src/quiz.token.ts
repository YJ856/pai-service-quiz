export const QUIZ_TOKENS = {
    QuizRepositoryPort: Symbol('QuizRepositoryPort'),
    QuizQueryPort: Symbol('QuizQueryPort'),
    QuizParentsQueryRepositoryPort: Symbol('QuizParentsQueryRepositoryPort'),
    QuizDetailQueryRepositoryPort: Symbol('QuizDetailQueryRepositoryPort'),
    QuizUpdateRepositoryPort: Symbol('QuizUpdateRepositoryPort'),
    QuizDeleteRepositoryPort: Symbol('QuizDeleteRepositoryPort'),
    QuizStatusTransitionPort: Symbol('QuizStatusTransitionPort'),

    CreateQuizUseCase: Symbol('CreateQuizUseCase'),
    GetNextPublishDateUseCase: Symbol('GetNextPublishDateUseCase'),
    ListParentsTodayUseCase: Symbol('ListParentsTodayUseCase'),
    ListParentsCompletedUseCase: Symbol('ListParentsCompletedUseCase'),
    ListParentsScheduledUseCase: Symbol('ListParentsScheduledUseCase'),
    GetParentsQuizDetailUseCase: Symbol('GetParentsQuizDetailUseCase'),
    UpdateQuizUseCase: Symbol('UpdateQuizUseCase'),
    DeleteQuizUseCase: Symbol('DeleteQuizUseCase'),

    // 외부 User 서비스 포트(프로필 디렉터리)
    ProfileDirectoryPort: Symbol('ProfileDirectoryPort'),
};