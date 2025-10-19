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

import { ChildGuard } from '../auth/guards/auth.guard';
import { Auth } from '../decorators/auth.decorator';

import { clampLimit } from '../../../../utils/pagination.util';

@Controller('api/quiz/children')
@UseGuards(ChildGuard)
export class ChildrenQuizController {
  constructor(
    @Inject(QUIZ_TOKENS.ListChildrenTodayUseCase)
    private readonly listChildrenTodayUseCase: ListChildrenTodayUseCase,

    @Inject(QUIZ_TOKENS.ListChildrenCompletedUseCase)
    private readonly listChildrenCompletedUseCase: ListChildrenCompletedUseCase,

    @Inject(QUIZ_TOKENS.AnswerQuizUseCase)
    private readonly answerQuizUseCase: AnswerQuizUseCase,

    private readonly quizMapper: QuizMapper,
  ) {}

  @Get('today')
  @HttpCode(HttpStatus.OK)
  async listChildrenToday(
    @Auth('profileId') childProfileId: number,
    @Query() query: ChildrenTodayQueryDto, // 바인딩된 쿼리 객체를 타입 지정
  ): Promise<BaseResponse<ChildrenTodayResponseData>> {
    const limit = clampLimit(query.limit);
    
    const raw = query?.cursor; // unknown | string | undefined
    const s = raw == null ? '' : String(raw).trim();
    const cursor = s === '' ? null : s;

    const data = await this.listChildrenTodayUseCase.execute({
      childProfileId,
      limit,
      cursor,
    });

    return { success: true, message: '자녀용 오늘의 퀴즈 조회 성공', data };
  }

  @Get('completed')
  @HttpCode(HttpStatus.OK)
  async listChildrenCompleted(
    @Auth('profileId') childProfileId: string,
    @Query() query: ChildrenCompletedQueryDto,
  ): Promise<BaseResponse<ChildrenCompletedResponseData>> {
    const limit = clampLimit(query.limit);
    const cursor = query?.cursor && String(query.cursor).trim() !== ''
      ? String(query.cursor).trim()
      : null;

    const data = await this.listChildrenCompletedUseCase.execute({
      childProfileId,
      limit,
      cursor,
    });

    return { success: true, message: '자녀용 완료된 퀴즈 조회 성공', data };
  }

  @Post(':quizId/answer')
  @HttpCode(HttpStatus.OK)
  async answerQuiz(
    @Auth('profileId') childProfileId: string,
    @Param('quizId') quizIdParam: string,
    @Body() body: AnswerQuizRequestDto,
  ): Promise<BaseResponse<AnswerQuizResponseData>> {
    const quizId = Number(quizIdParam);
    const cmd = this.quizMapper.toAnswerCommand(body, quizId, childProfileId);
    const data = await this.answerQuizUseCase.execute(cmd);

    const message = data.isSolved ? '정답입니다.' : '오답입니다.';

    return { success: true, message, data };
  }
}
