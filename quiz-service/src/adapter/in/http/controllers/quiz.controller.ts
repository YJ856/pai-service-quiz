// src/adapter/in/http/controllers/quiz.controller.ts
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';

// ✅ 요청/응답 타입은 타입 전용 import
import type { CreateQuizRequest, CreateQuizResponse } from '@your-scope/shared-type';

// ✅ 토큰은 런타임 값이므로 일반 import
import { QUIZ_TOKENS } from '../../../../quiz.token';

// ✅ 포트(인터페이스)는 타입 전용 import (런타임 심벌 아님)
import type { CreateQuizUseCase } from '../../../../application/port/in/create-quiz.usecase';

// ✅ Mapper는 클래스(런타임 값)라서 일반 import
import { QuizMapper } from '../../../../mapper/quiz.mapper';

// ✅ Guard: 토큰 검증 + 부모 권한 보장(ParentGuard에서 req.auth 세팅)
import { ParentGuard } from '../auth/guards/parent.guard';


// ✅ 범용 인증 데코레이터: req.auth.userId / req.auth.profileId를 깔끔히 주입
import { Auth } from '../decorators/auth.decorator';


@UseGuards(ParentGuard) 
@Controller('api/quiz') // 이 컨트롤러의 모든 핸들러는 parentGuard를 반드시 통과해야 함
export class QuizController {
  constructor(
    @Inject(QUIZ_TOKENS.CreateQuizUseCase)
    private readonly createQuiz: CreateQuizUseCase,
    private readonly mapper: QuizMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: CreateQuizRequest,            
    @Auth('profileId') parentProfileId: string,
  ): Promise<CreateQuizResponse> {
    const cmd = this.mapper.toCreateCommand(body, parentProfileId);
    const saved = await this.createQuiz.execute(cmd);
    return this.mapper.toCreateResponse(saved);
  }
}
