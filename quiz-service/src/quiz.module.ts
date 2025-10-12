// src/quiz.module.ts
import { Module } from '@nestjs/common';

// Controllers
import { QuizController } from './adapter/in/http/controllers/quiz.controller';

// Tokens
import { QUIZ_TOKENS } from './quiz.token';

// UseCases (구현)
import { CreateQuizService } from './application/use-cases/create-quiz.service';

// Ports 구현체(Adapters)
import { QuizRepositoryAdapter } from './adapter/out/persistence/quiz.repository.adapter';

// Infra (Prisma)
import { PrismaService } from './adapter/out/persistence/prisma/prisma.service';

// Mapper
import { QuizMapper } from './mapper/quiz.mapper';

// Guard
import { ParentGuard } from './adapter/in/http/auth/guards/parent.guard';

@Module({
  controllers: [QuizController],
  providers: [
    PrismaService,
    QuizMapper,
    ParentGuard,
    // Port ↔ Adapter
    { provide: QUIZ_TOKENS.QuizRepositoryPort, useClass: QuizRepositoryAdapter },

    // UseCase(계약) ↔ 구현
    { provide: QUIZ_TOKENS.CreateQuizUseCase, useClass: CreateQuizService },
  ],
  // exports: []  // 다른 모듈에서 이 토큰/서비스를 쓰게 하려면 여기에 내보내기
})
export class QuizModule {}
