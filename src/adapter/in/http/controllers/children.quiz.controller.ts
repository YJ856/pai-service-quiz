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
  Param,
} from '@nestjs/common';

import type {
  BaseResponse,
  ChildrenTodayQueryDto,
  ChildrenTodayResponseData,
  ChildrenCompletedQueryDto,
  ChildrenCompletedResponseData,
  AnswerQuizRequestDto,
  AnswerQuizResponseData,
} from 'pai-shared-types';

import { QUIZ_TOKENS } from '../../../../quiz.token';

import type { ListChildrenTodayUseCase } from '../../../../application/port/in/list-children-today.usecase';
import type { ListChildrenCompletedUseCase } from '../../../../application/port/in/list-children-completed.usecase';
import type { AnswerQuizUseCase } from '../../../../application/port/in/answer-quiz.usecase';

import { QuizMapper } from '../../../../mapper/quiz.mapper';

import { ChildGuard } from '../auth/guards/child.guard';
import { Auth } from '../decorators/auth.decorator';

import { clampLimit } from '../../../../utils/pagination.util';

@Controller('api/quiz')
@UseGuards(ChildGuard)
export class ChildrenQuizController {
  constructor(
    @Inject(QUIZ_TOKENS.ListChildrenTodayUseCase)
    private readonly listChildrenToday: ListChildrenTodayUseCase,

    @Inject(QUIZ_TOKENS.ListChildrenCompletedUseCase)
    private readonly listChildrenCompleted: ListChildrenCompletedUseCase,

    @Inject(QUIZ_TOKENS.AnswerQuizUseCase)
    private readonly answerQuiz: AnswerQuizUseCase,

    private readonly quizMapper: QuizMapper,
  ) {}

  @Get('children/today')
  @HttpCode(HttpStatus.OK)
  async listChildrenTodayHandler(
    @Auth('profileId') childProfileId: string,
    @Query() query: ChildrenTodayQueryDto,
  ): Promise<BaseResponse<ChildrenTodayResponseData>> {
    const limit = clampLimit(query.limit);
    const cursor = query?.cursor && String(query.cursor).trim() !== ''
      ? String(query.cursor).trim()
      : null;

    const data = await this.listChildrenToday.execute({
      childProfileId,
      limit,
      cursor,
    });

    return { success: true, message: '자녀용 오늘의 퀴즈 조회 성공', data };
  }

  @Get('children/completed')
  @HttpCode(HttpStatus.OK)
  async listChildrenCompletedHandler(
    @Auth('profileId') childProfileId: string,
    @Query() query: ChildrenCompletedQueryDto,
  ): Promise<BaseResponse<ChildrenCompletedResponseData>> {
    const limit = clampLimit(query.limit as any);
    const cursor = query?.cursor && String(query.cursor).trim() !== ''
      ? String(query.cursor).trim()
      : null;

    const data = await this.listChildrenCompleted.execute({
      childProfileId,
      limit,
      cursor,
    });

    return { success: true, message: '자녀용 완료된 퀴즈 조회 성공', data };
  }

  @Post('children/:quizId/answer')
  @HttpCode(HttpStatus.OK)
  async answerQuizHandler(
    @Auth('profileId') childProfileId: string,
    @Param('quizId') quizIdParam: string,
    @Body() body: AnswerQuizRequestDto,
  ): Promise<BaseResponse<AnswerQuizResponseData>> {
    const quizId = Number(quizIdParam);
    const cmd = this.quizMapper.toAnswerCommand(body, quizId, childProfileId);
    const data = await this.answerQuiz.execute(cmd);

    const message = data.isSolved ? '정답입니다.' : '오답입니다.';

    return { success: true, message, data };
  }
}
