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

import type {
  CreateQuizRequestDto,
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

import { QuizMapper } from '../../../../mapper/quiz.mapper';
import { NextPublishDateMapper } from '../../../../mapper/next-publish-date.mapper';

import { ParentGuard } from '../auth/guards/parent.guard';
import { Auth } from '../decorators/auth.decorator';

import { clampLimit } from '../../../../utils/pagination.util';

@Controller('api/quiz')
@UseGuards(ParentGuard)
export class ParentsQuizController {
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
    return { success: true, message: '퀴즈 생성 성공', data };
  }

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
}
