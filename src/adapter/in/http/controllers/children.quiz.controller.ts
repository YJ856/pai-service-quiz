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

import { ChildrenTodayMapper } from '../../../../mapper/children-today.mapper';
import { ChildrenCompletedMapper } from '../../../../mapper/children-completed.mapper';
import { AnswerQuizMapper } from '../../../../mapper/answer-quiz.mapper';

import { ChildGuard } from '../auth/guards/auth.guard';
import { Auth } from '../decorators/auth.decorator';

@Controller('api/quiz/children')
@UseGuards(ChildGuard)
export class ChildrenQuizController {
  constructor(
    @Inject(QUIZ_TOKENS.ListChildrenTodayUseCase)
    private readonly listChildrenTodayUseCase: ListChildrenTodayUseCase,
    private readonly childrenTodayMapper: ChildrenTodayMapper,

    @Inject(QUIZ_TOKENS.ListChildrenCompletedUseCase)
    private readonly listChildrenCompletedUseCase: ListChildrenCompletedUseCase,
    private readonly childrenCompletedMapper: ChildrenCompletedMapper,

    @Inject(QUIZ_TOKENS.AnswerQuizUseCase)
    private readonly answerQuizUseCase: AnswerQuizUseCase,
    private readonly answerQuizMapper: AnswerQuizMapper,
  ) {}

  @Get('today')
  @HttpCode(HttpStatus.OK)
  async listChildrenToday(
    @Auth('profileId') childProfileId: number,
    @Query() query: ChildrenTodayQueryDto,
  ): Promise<BaseResponse<ChildrenTodayResponseData>> {
    const cmd = this.childrenTodayMapper.toCommand(query, childProfileId);
    const result = await this.listChildrenTodayUseCase.execute(cmd);
    const data = this.childrenTodayMapper.toResponse(result);
    return { success: true, message: '자녀용 오늘의 퀴즈 조회 성공', data };
  }

  @Get('completed')
  @HttpCode(HttpStatus.OK)
  async listChildrenCompleted(
    @Auth('profileId') childProfileId: number,
    @Query() query: ChildrenCompletedQueryDto,
  ): Promise<BaseResponse<ChildrenCompletedResponseData>> {
    const cmd = this.childrenCompletedMapper.toCommand(query, childProfileId);
    const result = await this.listChildrenCompletedUseCase.execute(cmd);
    const data = this.childrenCompletedMapper.toResponse(result);
    return { success: true, message: '자녀용 완료된 퀴즈 조회 성공', data };
  }

  @Post(':quizId/answer')
  @HttpCode(HttpStatus.OK)
  async answerQuiz(
    @Auth('profileId') childProfileId: number,
    @Param('quizId') quizId: string,
    @Body() body: AnswerQuizRequestDto,
  ): Promise<BaseResponse<AnswerQuizResponseData>> {
    const cmd = this.answerQuizMapper.toCommand(
      { quizId },
      body,
      childProfileId,
    );
    const result = await this.answerQuizUseCase.execute(cmd);
    const data = this.answerQuizMapper.toResponse(result);
    const message = data.isSolved ? '정답입니다.' : '오답입니다.';

    return { success: true, message, data };
  }
}
