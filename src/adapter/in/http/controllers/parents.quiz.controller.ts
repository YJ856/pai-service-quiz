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

import { NextPublishDateMapper } from '../../../../mapper/next-publish-date.mapper';
import { CreateQuizMapper } from '../../../../mapper/create-quiz.mapper';
import { UpdateQuizMapper } from '../../../../mapper/update-quiz.mapper';
import { DeleteQuizMapper } from '../../../../mapper/delete-quiz.mapper';
import { DetailQuizMapper } from '../../../../mapper/detail-quiz.mapper';
import { ParentsTodayMapper } from '../../../../mapper/parents-today.mapper';
import { ParentsScheduledMapper } from '../../../../mapper/parents-scheduled.mapper';
import { ParentsCompletedMapper } from '../../../../mapper/parents-completed.mapper';

import { ParentGuard } from '../auth/guards/auth.guard';
import { Auth } from '../decorators/auth.decorator';

@Controller('api/quiz')
@UseGuards(ParentGuard)
export class ParentsQuizController {
  constructor(
    @Inject(QUIZ_TOKENS.CreateQuizUseCase)
    private readonly createQuiz: CreateQuizUseCase,
    private readonly createQuizMapper: CreateQuizMapper,

    @Inject(QUIZ_TOKENS.GetNextPublishDateUseCase)
    private readonly getNextPublishDate: GetNextPublishDateUseCase,
    private readonly nextPublishDateMapper: NextPublishDateMapper,

    @Inject(QUIZ_TOKENS.ListParentsTodayUseCase)
    private readonly listParentsToday: ListParentsTodayUseCase,
    private readonly parentsTodayMapper: ParentsTodayMapper,

    @Inject(QUIZ_TOKENS.ListParentsCompletedUseCase)
    private readonly listParentsCompleted: ListParentsCompletedUseCase,
    private readonly parentsCompletedMapper: ParentsCompletedMapper,

    @Inject(QUIZ_TOKENS.ListParentsScheduledUseCase)
    private readonly listParentsScheduled: ListParentsScheduledUseCase,
    private readonly parentsScheduledMapper: ParentsScheduledMapper,

    @Inject(QUIZ_TOKENS.GetParentsQuizDetailUseCase)
    private readonly getParentsQuizDetail: GetParentsQuizDetailUseCase,
    private readonly detailQuizMapper: DetailQuizMapper,

    @Inject(QUIZ_TOKENS.UpdateQuizUseCase)
    private readonly updateQuiz: UpdateQuizUseCase,
    private readonly updateQuizMapper: UpdateQuizMapper,

    @Inject(QUIZ_TOKENS.DeleteQuizUseCase)
    private readonly deleteQuiz: DeleteQuizUseCase,
    private readonly deleteQuizMapper: DeleteQuizMapper,
  ) {}

  @Get('next-publish-date')
  @HttpCode(HttpStatus.OK)
  async getNextPublishDateHandler(
    @Auth('profileId') parentProfileId: number,
  ): Promise<BaseResponse<NextPublishDateData>> {
    const ymd = await this.getNextPublishDate.execute(parentProfileId);
    const data = this.nextPublishDateMapper.toResponseData(ymd);
    return { success: true, message: '기본 출제일 조회 성공', data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: CreateQuizRequestDto,
    @Auth('profileId') parentProfileId: number,
  ): Promise<BaseResponse<CreateQuizResponseData>> {
    const cmd = this.createQuizMapper.toCommand(parentProfileId, body);
    const saved = await this.createQuiz.execute(cmd);
    const data = this.createQuizMapper.toResponse(saved);
    return { success: true, message: '퀴즈 생성 성공', data };
  }

  @Get('parents/today')
  @HttpCode(HttpStatus.OK)
  async listParentsTodayHandler(
    @Auth('profileId') parentProfileId: number,
    @Query() query: ParentsTodayQueryDto,
  ): Promise<BaseResponse<ParentsTodayResponseData>> {
    const cmd = this.parentsTodayMapper.toCommand(query, parentProfileId);
    const result = await this.listParentsToday.execute(cmd);
    const data = this.parentsTodayMapper.toResponse(result);
    return { success: true, message: '오늘의 퀴즈 조회 성공', data };
  }

  @Get('parents/completed')
  @HttpCode(HttpStatus.OK)
  async listParentsCompletedHandler(
    @Auth('profileId') parentProfileId: number,
    @Query() query: ParentsCompletedQueryDto,
  ): Promise<BaseResponse<ParentsCompletedResponseData>> {
    const cmd = this.parentsCompletedMapper.toCommand(query, parentProfileId);
    const result = await this.listParentsCompleted.execute(cmd);
    const data = this.parentsCompletedMapper.toResponse(result);
    return { success: true, message: '완료된 퀴즈 조회 성공', data };
  }

  @Get('parents/scheduled')
  @HttpCode(HttpStatus.OK)
  async listParentsScheduledHandler(
    @Auth('profileId') parentProfileId: number,
    @Query() query: ParentsScheduledQueryDto,
  ): Promise<BaseResponse<ParentsScheduledResponseData>> {
    const cmd = this.parentsScheduledMapper.toCommand(query, parentProfileId);
    const result = await this.listParentsScheduled.execute(cmd);
    const data = this.parentsScheduledMapper.toResponse(result);
    return { success: true, message: '예정된 퀴즈 조회 성공', data };
  }

  @Get(':quizId')
  @HttpCode(HttpStatus.OK)
  async getParentsQuizDetailHandler(
    @Param('quizId') quizIdParam: number,
    @Auth('profileId') parentProfileId: number,
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
    @Param('quizId') quizIdParam: number,
    @Auth('profileId') parentProfileId: number,
    @Body() body: UpdateQuizRequestDto,
  ): Promise<BaseResponse<UpdateQuizResponseData>> {
    const quizId = Number(quizIdParam);
    if (!Number.isFinite(quizId) || quizId <= 0) {
      throw new BadRequestException('VALIDATION_ERROR');
    }

    const cmd = this.updateQuizMapper.toCommand(quizId, parentProfileId, body ?? {});
    const updatedQuiz = await this.updateQuiz.execute(cmd);
    const data = this.updateQuizMapper.toResponse(updatedQuiz);
    return { success: true, message: '수정이 완료되었습니다!', data };
  }

  @Delete(':quizId')
  @HttpCode(HttpStatus.OK)
  async deleteQuizHandler(
    @Param('quizId') quizIdParam: number,
    @Auth('profileId') parentProfileId: number,
  ): Promise<BaseResponse<DeleteQuizResponseData>> {
    const quizId = Number(quizIdParam);
    if (!Number.isFinite(quizId) || quizId <= 0) {
      throw new BadRequestException('VALIDATION_ERROR');
    }

    const cmd = this.deleteQuizMapper.toCommand(quizId, parentProfileId);
    await this.deleteQuiz.execute(cmd);
    const data = this.deleteQuizMapper.toResponse(quizId);

    return { success: true, message: '삭제가 완료되었습니다!', data };
  }
}
