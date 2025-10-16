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
  Patch,
  Delete,
  BadRequestException,
} from '@nestjs/common';

import type { CreateQuizRequestDto,
              CreateQuizResponseData,
              BaseResponse,
              NextPublishDateData,
              ParentsTodayQueryDto,
              ParentsTodayResponseData,
              ParentsCompletedQueryDto,
              ParentsCompletedResponseData,
              ParentsScheduledQueryDto,
              ParentsScheduledResponseData,
              ParentsQuizDetailResponseData,
              UpdateQuizRequestDto,
              UpdateQuizResponseData,
              DeleteQuizResponseData,
              ChildrenTodayQueryDto,
              ChildrenTodayResponseData,
              ChildrenCompletedQueryDto,
              ChildrenCompletedResponseData,
              AnswerQuizRequestDto,
              AnswerQuizResponseData,
             } from 'pai-shared-types';

import { QUIZ_TOKENS } from '../../../../quiz.token';

import type { CreateQuizUseCase } from '../../../../application/port/in/create-quiz.usecase';
import type { GetNextPublishDateUseCase } from '../../../../application/port/in/next-publish-date.usecase';
import type { ListParentsTodayUseCase } from '../../../../application/port/in/list-parents-today.usecase';
import type { ListParentsCompletedUseCase } from '../../../../application/port/in/list-parents-completed.usecase';
import type { ListParentsScheduledUseCase } from '../../../../application/port/in/list-parents-scheduled.usecase';
import type { GetParentsQuizDetailUseCase } from '../../../../application/port/in/get-parents-quiz-detail.usecase';
import type { UpdateQuizUseCase } from '../../../../application/port/in/update-quiz.usecase';
import type { DeleteQuizUseCase } from '../../../../application/port/in/delete-quiz.usecase';
import type { ListChildrenTodayUseCase } from '../../../../application/port/in/list-children-today.usecase';
import type { ListChildrenCompletedUseCase } from '../../../../application/port/in/list-children-completed.usecase';
import type { AnswerQuizUseCase } from '../../../../application/port/in/answer-quiz.usecase';

import { QuizMapper } from '../../../../mapper/quiz.mapper';
import { NextPublishDateMapper } from '../../../../mapper/next-publish-date.mapper';

import { ParentGuard } from '../auth/guards/parent.guard';
import { ChildGuard } from '../auth/guards/child.guard';
import { Auth } from '../decorators/auth.decorator';

// Utils
import { clampLimit } from '../../../../utils/pagination.util';

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

    @Inject(QUIZ_TOKENS.ListParentsCompletedUseCase)
    private readonly listParentsCompleted: ListParentsCompletedUseCase,

    @Inject(QUIZ_TOKENS.ListParentsScheduledUseCase)
    private readonly listParentsScheduled: ListParentsScheduledUseCase,

    @Inject(QUIZ_TOKENS.GetParentsQuizDetailUseCase)
    private readonly getParentsQuizDetail: GetParentsQuizDetailUseCase,

    @Inject(QUIZ_TOKENS.UpdateQuizUseCase)
    private readonly updateQuiz: UpdateQuizUseCase,

    @Inject(QUIZ_TOKENS.DeleteQuizUseCase)
    private readonly deleteQuiz: DeleteQuizUseCase,

    @Inject(QUIZ_TOKENS.ListChildrenTodayUseCase)
    private readonly listChildrenToday: ListChildrenTodayUseCase,

    @Inject(QUIZ_TOKENS.ListChildrenCompletedUseCase)
    private readonly listChildrenCompleted: ListChildrenCompletedUseCase,

    @Inject(QUIZ_TOKENS.AnswerQuizUseCase)
    private readonly answerQuiz: AnswerQuizUseCase,
  ) {}

  @UseGuards(ParentGuard) 
  @Get('next-publish-date')
  @HttpCode(HttpStatus.OK)
  async getNextPublishDateHandler(
    @Auth('profileId') parentProfileId: string,
  ): Promise<BaseResponse<NextPublishDateData>> {
    const ymd = await this.getNextPublishDate.execute(parentProfileId);
    const data = this.nextPublishDateMapper.toResponseData(ymd);
    return { success: true, message: '기본 출제일 조회 성공', data };
  }

  @UseGuards(ParentGuard) 
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: CreateQuizRequestDto,            
    @Auth('profileId') parentProfileId: string,
  ): Promise<BaseResponse<CreateQuizResponseData>> {
    const cmd = this.quizMapper.toCreateCommand(body, parentProfileId);
    const saved = await this.createQuiz.execute(cmd);
    const data = this.quizMapper.toCreateResponse(saved);
    return { success: true, message: '퀴즈 생성 성공', data };
  }

  @UseGuards(ParentGuard)
  @Get('parents/today')
  @HttpCode(HttpStatus.OK)
  async listParentsTodayHandler(
    @Auth('profileId') parentProfileId: string,
    @Query() query: ParentsTodayQueryDto,
  ): Promise<BaseResponse<ParentsTodayResponseData>> {
    const limit = clampLimit(query.limit);
    const cursor = query?.cursor && String(query.cursor).trim() !== ''
      ? String(query.cursor).trim()
      : null;

    const data = await this.listParentsToday.execute({
      parentProfileId,
      limit,
      cursor,
    });

    return { success: true, message: '오늘의 퀴즈 조회 성공', data };
  }

  @UseGuards(ParentGuard)
  @Get('parents/completed')
  @HttpCode(HttpStatus.OK)
  async listParentsCompletedHandler(
    @Auth('profileId') parentProfileId: string,
    @Query() query: ParentsCompletedQueryDto,
  ): Promise<BaseResponse<ParentsCompletedResponseData>> {
    const limit = clampLimit(query.limit as any);
    const cursor = query?.cursor && String(query.cursor).trim() !== ''
      ? String(query.cursor).trim()
      : null;

    const data = await this.listParentsCompleted.execute({
      parentProfileId,
      limit,
      cursor,
    });

    return { success: true, message: '완료된 퀴즈 조회 성공', data };
  }

  @UseGuards(ParentGuard)
  @Get('parents/scheduled')
  @HttpCode(HttpStatus.OK)
  async listParentsScheduledHandler(
    @Auth('profileId') parentProfileId: string,
    @Query() query: ParentsScheduledQueryDto,
  ): Promise<BaseResponse<ParentsScheduledResponseData>> {
    const limit = clampLimit(query.limit as any);
    const cursor = query?.cursor && String(query.cursor).trim() !== ''
      ? String(query.cursor).trim()
      : null;

    const data = await this.listParentsScheduled.execute({
      parentProfileId,
      limit,
      cursor,
    });

    return { success: true, message: '예정된 퀴즈 조회 성공', data };
  }

  @UseGuards(ParentGuard)
  @Get(':quizId')
  @HttpCode(HttpStatus.OK)
  async getParentsQuizDetailHandler(
    @Param('quizId') quizIdParam: string,
    @Auth('profileId') parentProfileId: string,
  ): Promise<BaseResponse<ParentsQuizDetailResponseData>> {
    const quizId = Number(quizIdParam);
    if (!Number.isFinite(quizId) || quizId <= 0) {
      throw new BadRequestException('VALIDATION_ERROR');
    }

    const data = await this.getParentsQuizDetail.execute({
      quizId,
      parentProfileId,
    });

    return { success: true, message: '퀴즈 상세 조회 성공', data };
  }

  @UseGuards(ParentGuard)
  @Patch(':quizId')
  @HttpCode(HttpStatus.OK)
  async updateQuizHandler(
    @Param('quizId') quizIdParam: string,
    @Auth('profileId') parentProfileId: string,
    @Body() body: UpdateQuizRequestDto,
  ): Promise<BaseResponse<UpdateQuizResponseData>> {
    const quizId = Number(quizIdParam);
    if (!Number.isFinite(quizId) || quizId <= 0) {
      throw new BadRequestException('VALIDATION_ERROR');
    }

    const cmd = this.quizMapper.toUpdateCommand(body ?? {}, quizId, parentProfileId);
    const updatedQuiz = await this.updateQuiz.execute(cmd);
    const data = this.quizMapper.toUpdateResponse(updatedQuiz);

    return { success: true, message: '수정이 완료되었습니다!', data };
  }

  @UseGuards(ParentGuard)
  @Delete(':quizId')
  @HttpCode(HttpStatus.OK)
  async deleteQuizHandler(
    @Param('quizId') quizIdParam: string,
    @Auth('profileId') parentProfileId: string,
  ): Promise<BaseResponse<DeleteQuizResponseData>> {
    const quizId = Number(quizIdParam);
    if (!Number.isFinite(quizId) || quizId <= 0) {
      throw new BadRequestException('VALIDATION_ERROR');
    }

    const cmd = this.quizMapper.toDeleteCommand(quizId, parentProfileId);
    await this.deleteQuiz.execute(cmd);
    const data = this.quizMapper.toDeleteResponse(quizId);

    return { success: true, message: '삭제가 완료되었습니다!', data };
  }

  @UseGuards(ChildGuard)
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

  @UseGuards(ChildGuard)
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

  @UseGuards(ChildGuard)
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

    // isSolved 값에 따라 message 변경
    const message = data.isSolved ? '정답입니다.' : '오답입니다.';

    return { success: true, message, data };
  }

}
