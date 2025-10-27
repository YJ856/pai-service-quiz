import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

// Controllers
import { ParentsQuizController } from './adapter/in/http/controllers/parents.quiz.controller';
import { ChildrenQuizController } from './adapter/in/http/controllers/children.quiz.controller';

// Tokens
import { QUIZ_TOKENS } from './quiz.token';

// Ports 구현체(Adapters)
import { QuizRepositoryAdapter } from './adapter/out/persistence/quiz.repository.adapter';
import { QuizQueryAdapter } from './adapter/out/persistence/quiz.query.adapter';
import { ProfileDirectoryHttpAdapter } from './adapter/out/user/profile-directory.http.adapter';

// UseCases (구현)
// 부모
import { GetNextPublishDateService } from './application/use-cases/next-publish-date.service';
import { GetParentsQuizDetailService } from './application/use-cases/get-parents-quiz-detail.service';
import { ListParentsTodayService } from './application/use-cases/list-parents-today.service';
import { ListParentsCompletedService } from './application/use-cases/list-parents-completed.service';
import { ListParentsScheduledService } from './application/use-cases/list-parents-scheduled.service';
import { CreateQuizService } from './application/use-cases/create-quiz.service';
import { UpdateQuizService } from './application/use-cases/update-quiz.service';
import { DeleteQuizService } from './application/use-cases/delete-quiz.service';
// 아이
import { ListChildrenTodayService } from './application/use-cases/list-children-today.service';
import { ListChildrenCompletedService } from './application/use-cases/list-children-completed.service';
import { AnswerQuizService } from './application/use-cases/answer-quiz.service';

// Infra (Prisma)
import { PrismaService } from './adapter/out/persistence/prisma/prisma.service';

// Mappers
import { NextPublishDateMapper } from './mapper/next-publish-date.mapper';
import { CreateQuizMapper } from './mapper/parents-create-quiz.mapper';
import { UpdateQuizMapper } from './mapper/parents-update-quiz.mapper';
import { DeleteQuizMapper } from './mapper/parents-delete-quiz.mapper';
import { DetailQuizMapper } from './mapper/parents-detail-quiz.mapper';
import { ParentsTodayMapper } from './mapper/parents-today-quiz.mapper';
import { ParentsScheduledMapper } from './mapper/parents-scheduled-quiz.mapper';
import { ParentsCompletedMapper } from './mapper/parents-completed-quiz.mapper';
import { ChildrenTodayMapper } from './mapper/children-today-quiz.mapper';
import { ChildrenCompletedMapper } from './mapper/children-completed-quiz.mapper';
import { AnswerQuizMapper } from './mapper/children-answer-quiz.mapper';

// Guard
import { ParentGuard } from './adapter/in/http/auth/guards/auth.guard';
import { ChildGuard } from './adapter/in/http/auth/guards/auth.guard';


@Module({
  imports: [HttpModule],
  controllers: [ParentsQuizController, ChildrenQuizController],
  providers: [
    PrismaService,
    NextPublishDateMapper,
    CreateQuizMapper,
    UpdateQuizMapper,
    DeleteQuizMapper,
    DetailQuizMapper,
    ParentsTodayMapper,
    ParentsScheduledMapper,
    ParentsCompletedMapper,
    ChildrenTodayMapper,
    ChildrenCompletedMapper,
    AnswerQuizMapper,
    ParentGuard,
    ChildGuard,

    // Port ↔ Adapter
    { provide: QUIZ_TOKENS.QuizQueryPort, useClass: QuizQueryAdapter },
    { provide: QUIZ_TOKENS.QuizCommandPort, useClass: QuizRepositoryAdapter },
    { provide: QUIZ_TOKENS.ProfileDirectoryPort, useClass: ProfileDirectoryHttpAdapter },

    // UseCase(계약) ↔ 구현
    // 부모
    { provide: QUIZ_TOKENS.GetNextPublishDateUseCase, useClass: GetNextPublishDateService },
    { provide: QUIZ_TOKENS.GetParentsQuizDetailUseCase, useClass: GetParentsQuizDetailService },
    { provide: QUIZ_TOKENS.ListParentsTodayUseCase, useClass: ListParentsTodayService },
    { provide: QUIZ_TOKENS.ListParentsCompletedUseCase, useClass: ListParentsCompletedService },
    { provide: QUIZ_TOKENS.ListParentsScheduledUseCase, useClass: ListParentsScheduledService },
    { provide: QUIZ_TOKENS.CreateQuizUseCase, useClass: CreateQuizService },
    { provide: QUIZ_TOKENS.UpdateQuizUseCase, useClass: UpdateQuizService },
    { provide: QUIZ_TOKENS.DeleteQuizUseCase, useClass: DeleteQuizService },
    // 아이
    { provide: QUIZ_TOKENS.ListChildrenTodayUseCase, useClass: ListChildrenTodayService },
    { provide: QUIZ_TOKENS.ListChildrenCompletedUseCase, useClass: ListChildrenCompletedService },
    { provide: QUIZ_TOKENS.AnswerQuizUseCase, useClass: AnswerQuizService },
  ],
  // exports: []  // 다른 모듈에서 이 토큰/서비스를 쓰게 하려면 여기에 내보내기
})
export class QuizModule {}
