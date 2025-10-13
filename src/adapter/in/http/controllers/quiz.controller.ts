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
  Query,
} from '@nestjs/common';

import type { CreateQuizRequestDto, 
              CreateQuizResponseData, 
              BaseResponse, 
              NextPublishDateData,
              ParentsTodayQueryDto,
              ParentsTodayResponseData } from 'pai-shared-types';

import { QUIZ_TOKENS } from '../../../../quiz.token';

import type { CreateQuizUseCase } from '../../../../application/port/in/create-quiz.usecase';
import type { GetNextPublishDateUseCase } from '../../../../application/port/in/next-publish-date.usecase';
import type { ListParentsTodayUseCase } from '../../../../application/port/in/list-parents-today.usecase';

import { QuizMapper } from '../../../../mapper/quiz.mapper';
import { NextPublishDateMapper } from '../../../../mapper/next-publish-date.mapper';

import { ParentGuard } from '../auth/guards/parent.guard';
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

    @Inject(QUIZ_TOKENS.ListParentsTodayUseCase)
    private readonly listParentsToday: ListParentsTodayUseCase,
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

  @Get('parents/today')
  @HttpCode(HttpStatus.OK)
  async listParentsTodayHandler(
    @Auth('profileId') parentProfileId: string,
    @Query() query: ParentsTodayQueryDto,
  ): Promise<BaseResponse<ParentsTodayResponseData>> {
    const rawLimit = (query as any)?.limit;
    let limit = 20; // 기본값
    if (rawLimit !== undefined) {
      const x = Number(rawLimit);
      if (Number.isFinite(x)) {
        limit = Math.max(1, Math.min(x, 50));
      }
    }

    const cursor =
      query?.cursor && String(query.cursor).trim() !== ''
        ? String(query.cursor).trim()
        : null; // 빈 문자열이면 null 처리

    const data = await this.listParentsToday.execute({
      parentProfileId,
      limit,
      cursor,
    });

    return {
      success: true,
      message: '오늘의 퀴즈 조회 성공',
      data,
    };
  }
}
