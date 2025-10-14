import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { QuizController } from './adapter/in/http/controllers/quiz.controller';

// Tokens
import { QUIZ_TOKENS } from './quiz.token';

// UseCases (구현)
import { CreateQuizService } from './application/use-cases/create-quiz.service';
import { GetNextPublishDateService } from './application/use-cases/next-publish-date.service';
import { ListParentsTodayService } from './application/use-cases/list-parents-today.service';
import { ListParentsCompletedService } from './application/use-cases/list-parents-completed.service';
import { ListParentsScheduledService } from './application/use-cases/list-parents-scheduled.service';
import { TransitionQuizStatusService } from './application/use-cases/transition-quiz-status.service';
import { GetParentsQuizDetailService } from './application/use-cases/get-parents-quiz-detail.service';
import { UpdateQuizService } from './application/use-cases/update-quiz.service';

// Ports 구현체(Adapters)
import { QuizRepositoryAdapter } from './adapter/out/persistence/quiz.repository.adapter';
import { QuizQueryAdapter } from './adapter/out/persistence/quiz.query.adapter';
import { ProfileDirectoryHttpAdapter } from './adapter/out/user/profile-directory.http.adapter';
import { QuizUpdateAdapter } from './adapter/out/persistence/quiz.update.adapter';

// Infra (Prisma)
import { PrismaService } from './adapter/out/persistence/prisma/prisma.service';

// Mapper
import { QuizMapper } from './mapper/quiz.mapper';

// Guard
import { ParentGuard } from './adapter/in/http/auth/guards/parent.guard';
import { NextPublishDateMapper } from './mapper/next-publish-date.mapper';

// scheduler
import { QuizCron } from './adapter/in/scheduler/quiz.cron';


@Module({
  imports: [HttpModule, ScheduleModule.forRoot()],
  controllers: [QuizController],
  providers: [
    PrismaService,
    QuizMapper,
    ParentGuard,
    NextPublishDateMapper,
    TransitionQuizStatusService,
    // Port ↔ Adapter
    { provide: QUIZ_TOKENS.QuizRepositoryPort, useClass: QuizRepositoryAdapter },
    { provide: QUIZ_TOKENS.QuizQueryPort, useClass: QuizQueryAdapter },
    { provide: QUIZ_TOKENS.QuizParentsQueryRepositoryPort, useExisting: QuizQueryAdapter },
    { provide: QUIZ_TOKENS.QuizDetailQueryRepositoryPort, useExisting: QuizQueryAdapter },
    { provide: QUIZ_TOKENS.ProfileDirectoryPort, useClass: ProfileDirectoryHttpAdapter },
    { provide: QUIZ_TOKENS.QuizUpdateRepositoryPort, useClass: QuizUpdateAdapter },

    // UseCase(계약) ↔ 구현
    { provide: QUIZ_TOKENS.CreateQuizUseCase, useClass: CreateQuizService },
    { provide: QUIZ_TOKENS.GetNextPublishDateUseCase, useClass: GetNextPublishDateService },
    { provide: QUIZ_TOKENS.ListParentsTodayUseCase, useClass: ListParentsTodayService },
    { provide: QUIZ_TOKENS.ListParentsCompletedUseCase, useClass: ListParentsCompletedService },
    { provide: QUIZ_TOKENS.ListParentsScheduledUseCase, useClass: ListParentsScheduledService },
    { provide: QUIZ_TOKENS.GetParentsQuizDetailUseCase, useClass: GetParentsQuizDetailService },
    { provide: QUIZ_TOKENS.UpdateQuizUseCase, useClass: UpdateQuizService },

    // 배치 + 크론
    TransitionQuizStatusService,
    QuizCron,
    
  ],
  // exports: []  // 다른 모듈에서 이 토큰/서비스를 쓰게 하려면 여기에 내보내기
})
export class QuizModule {}
