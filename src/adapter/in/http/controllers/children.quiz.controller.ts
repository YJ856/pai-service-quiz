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
  ChildrenTodayResponseData,
  ChildrenCompletedResponseData,
  AnswerQuizResponseData,
} from 'pai-shared-types';

import { ChildrenTodayQueryParam } from '../dto/request/children-today-quiz-request.dto';
import { ChildrenCompletedQueryParam } from '../dto/request/children-completed-quiz-request.dto';
import {
  AnswerQuizPathParam,
  AnswerQuizRequestDto,
} from '../dto/request/children-answer-quiz-request.dto';

import { QUIZ_TOKENS } from '../../../../quiz.token';

import type { ListChildrenTodayUseCase } from '../../../../application/port/in/children-today-quiz.usecase';
import type { ListChildrenCompletedUseCase } from '../../../../application/port/in/children-completed-quiz.usecase';
import type { AnswerQuizUseCase } from '../../../../application/port/in/children-answer-quiz.usecase';

import { ChildrenTodayMapper } from '../mapper/children-today-quiz.mapper';
import { ChildrenCompletedMapper } from '../mapper/children-completed-quiz.mapper';
import { AnswerQuizMapper } from '../mapper/children-answer-quiz.mapper';

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
  async childrenTodayQuiz(
    @Auth('profileId') childProfileId: number,
    @Query() query: ChildrenTodayQueryParam,
  ): Promise<BaseResponse<ChildrenTodayResponseData>> {
    const command = this.childrenTodayMapper.toCommand(query, childProfileId);
    const result = await this.listChildrenTodayUseCase.execute(command);
    const data = this.childrenTodayMapper.toResponse(result);
    return { success: true, message: '자녀용 오늘의 퀴즈 조회 성공', data };
  }

  @Get('completed')
  @HttpCode(HttpStatus.OK)
  async childrenCompletedQuiz(
    @Auth('profileId') childProfileId: number,
    @Query() query: ChildrenCompletedQueryParam,
  ): Promise<BaseResponse<ChildrenCompletedResponseData>> {
    const command = this.childrenCompletedMapper.toCommand(
      query,
      childProfileId,
    );
    const result = await this.listChildrenCompletedUseCase.execute(command);
    const data = this.childrenCompletedMapper.toResponse(result);
    return { success: true, message: '자녀용 완료된 퀴즈 조회 성공', data };
  }

  @Post(':quizId/answer')
  @HttpCode(HttpStatus.OK)
  async childrenAnswerQuiz(
    @Auth('profileId') childProfileId: number,
    @Param() path: AnswerQuizPathParam,
    @Body() body: AnswerQuizRequestDto,
  ): Promise<BaseResponse<AnswerQuizResponseData>> {
    const command = this.answerQuizMapper.toCommand(
      { quizId: path.quizId },
      body,
      childProfileId,
    );
    const result = await this.answerQuizUseCase.execute(command);
    const data = this.answerQuizMapper.toResponse(result);
    const message = data.isSolved ? '정답입니다.' : '오답입니다.';

    return { success: true, message, data };
  }
}
