// src/adapter/in/http/controllers/quiz.controller.ts
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Get,
  UseGuards,
} from '@nestjs/common';

// 요청/응답 타입은 타입 전용 import
import type { CreateQuizRequestDto, CreateQuizResponseData, BaseResponse, NextPublishDateData } from 'pai-shared-types';

// 토큰은 런타임 값이므로 일반 import
import { QUIZ_TOKENS } from '../../../../quiz.token';

// 포트(인터페이스)는 타입 전용 import (런타임 심벌 아님)
import type { CreateQuizUseCase } from '../../../../application/port/in/create-quiz.usecase';
import type { GetNextPublishDateUseCase } from '../../../../application/port/in/next-publish-date.usecase';

// Mapper는 클래스(런타임 값)라서 일반 import
import { QuizMapper } from '../../../../mapper/quiz.mapper';
import { NextPublishDateMapper } from '../../../../mapper/next-publish-date.mapper';

// Guard: 토큰 검증 + 부모 권한 보장(ParentGuard에서 req.auth 세팅)
import { ParentGuard } from '../auth/guards/parent.guard';

// 범용 인증 데코레이터: req.auth.userId / req.auth.profileId를 깔끔히 주입
import { Auth } from '../decorators/auth.decorator';


@UseGuards(ParentGuard) 
@Controller('api/quiz') // 이 컨트롤러의 모든 핸들러는 parentGuard를 반드시 통과해야 함
export class QuizController {
  constructor(
    @Inject(QUIZ_TOKENS.CreateQuizUseCase)
    private readonly createQuiz: CreateQuizUseCase,
    private readonly quizMapper: QuizMapper,

    @Inject(QUIZ_TOKENS.GetNextPublishDateUseCase)
    private readonly getNextPublishDate: GetNextPublishDateUseCase,
    private readonly nextPublishDateMapper: NextPublishDateMapper,
  ) {}

  @Get('next-publish-date')
  @HttpCode(HttpStatus.OK)
  async getNextPublishDateHandler(
    @Auth('profileId') parentProfileId: string,
  ): Promise<BaseResponse<NextPublishDateData>> {
    const ymd = await this.getNextPublishDate.execute(parentProfileId);
    const data = this.nextPublishDateMapper.toResponseData(ymd);
    return { success: true, message: '기본 출제일 조회 성공', data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: CreateQuizRequestDto,            
    @Auth('profileId') parentProfileId: string,
  ): Promise<BaseResponse<CreateQuizResponseData>> {
    const cmd = this.quizMapper.toCreateCommand(body, parentProfileId);
    const saved = await this.createQuiz.execute(cmd);
    const data = this.quizMapper.toCreateResponse(saved);
    return {
      success: true,
      message: '퀴즈 생성 성공',
      data,
    };
  }
}
