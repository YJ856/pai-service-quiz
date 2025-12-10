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
} from '@nestjs/common';

import type {
  BaseResponse,
  CreateQuizResponseData,
  NextPublishDateData,
  ParentsTodayResponseData,
  ParentsCompletedResponseData,
  ParentsScheduledResponseData,
  ParentsQuizDetailResponseData,
  UpdateQuizResponseData,
  DeleteQuizResponseData,
  ParentsGrantRewardResponseData,
} from 'pai-shared-types';

import { CreateQuizRequestDto } from '../dto/request/parents-create-quiz-request.dto';
import { ParentsTodayQueryParam } from '../dto/request/parents-today-quiz-request.dto';
import { ParentsCompletedQueryParam } from '../dto/request/parents-completed-quiz-request.dto';
import { ParentsScheduledQueryParam } from '../dto/request/parents-scheduled-quiz-request.dto';
import { UpdateQuizPathParam, UpdateQuizRequestDto } from '../dto/request/parents-update-quiz-request.dto';
import { ParentsGrantRewardPathParam, ParentsGrantRewardRequestDto } from '../dto/request/parents-grant-reward-request.dto';
import { ParentsQuizDetailPathParam } from '../dto/request/parents-detail-quiz-request.dto';
import { DeleteQuizPathParam } from '../dto/request/parents-delete-quiz-request.dto';

import { QUIZ_TOKENS } from '../../../../quiz.token';

import type { CreateQuizUseCase } from '../../../../application/port/in/parents-create-quiz.usecase';
import type { GetNextPublishDateUseCase } from '../../../../application/port/in/next-publish-date.usecase';
import type { ListParentsTodayUseCase } from '../../../../application/port/in/parents-today-quiz.usecase';
import type { ListParentsCompletedUseCase } from '../../../../application/port/in/parents-completed-quiz.usecase';
import type { ListParentsScheduledUseCase } from '../../../../application/port/in/parents-scheduled-quiz.usecase';
import type { GetParentsQuizDetailUseCase } from '../../../../application/port/in/parents-detail-quiz.usecase';
import type { UpdateQuizUseCase } from '../../../../application/port/in/parents-update-quiz.usecase';
import type { DeleteQuizUseCase } from '../../../../application/port/in/parents-delete-quiz.usecase';
import type { GrantRewardUseCase } from 'src/application/port/in/parents-grant-reward.usecase';

import { NextPublishDateMapper } from '../mapper/next-publish-date.mapper';
import { CreateQuizMapper } from '../mapper/parents-create-quiz.mapper';
import { UpdateQuizMapper } from '../mapper/parents-update-quiz.mapper';
import { DeleteQuizMapper } from '../mapper/parents-delete-quiz.mapper';
import { DetailQuizMapper } from '../mapper/parents-detail-quiz.mapper';
import { ParentsTodayMapper } from '../mapper/parents-today-quiz.mapper';
import { ParentsScheduledMapper } from '../mapper/parents-scheduled-quiz.mapper';
import { ParentsCompletedMapper } from '../mapper/parents-completed-quiz.mapper';
import { ParentsGrantRewardMapper } from '../mapper/parents-grant-reward.mapper';

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

    @Inject(QUIZ_TOKENS.GrantRewardUseCase)
    private readonly grantReward: GrantRewardUseCase,
    private readonly parentsGrantRewardMapper: ParentsGrantRewardMapper,
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
    const result = await this.createQuiz.execute(cmd);
    const data = this.createQuizMapper.toResponse(result);
    return { success: true, message: '퀴즈 생성 성공', data };
  }

  @Get('parents/today')
  @HttpCode(HttpStatus.OK)
  async listParentsTodayHandler(
    @Auth('profileId') parentProfileId: number,
    @Query() query: ParentsTodayQueryParam,
  ): Promise<BaseResponse<ParentsTodayResponseData>> {
    const command = this.parentsTodayMapper.toCommand(query, parentProfileId);
    const result = await this.listParentsToday.execute(command);
    const data = this.parentsTodayMapper.toResponse(result);
    return { success: true, message: '오늘의 퀴즈 조회 성공', data };
  }

  @Get('parents/completed')
  @HttpCode(HttpStatus.OK)
  async listParentsCompletedHandler(
    @Auth('profileId') parentProfileId: number,
    @Query() query: ParentsCompletedQueryParam,
  ): Promise<BaseResponse<ParentsCompletedResponseData>> {
    const command = this.parentsCompletedMapper.toCommand(query, parentProfileId);
    const result = await this.listParentsCompleted.execute(command);
    const data = this.parentsCompletedMapper.toResponse(result);
    return { success: true, message: '완료된 퀴즈 조회 성공', data };
  }

  @Get('parents/scheduled')
  @HttpCode(HttpStatus.OK)
  async listParentsScheduledHandler(
    @Auth('profileId') parentProfileId: number,
    @Query() query: ParentsScheduledQueryParam,
  ): Promise<BaseResponse<ParentsScheduledResponseData>> {
    const command = this.parentsScheduledMapper.toCommand(query, parentProfileId);
    const result = await this.listParentsScheduled.execute(command);
    const data = this.parentsScheduledMapper.toResponse(result);
    return { success: true, message: '예정된 퀴즈 조회 성공', data };
  }

  @Get(':quizId')
  @HttpCode(HttpStatus.OK)
  async getParentsQuizDetailHandler(
    @Param() path: ParentsQuizDetailPathParam,
    @Auth('profileId') parentProfileId: number,
  ): Promise<BaseResponse<ParentsQuizDetailResponseData>> {
    const command = this.detailQuizMapper.toCommand(path.quizId, parentProfileId);
    const result = await this.getParentsQuizDetail.execute(command);
    const data = this.detailQuizMapper.toResponse(result);

    return { success: true, message: '퀴즈 상세 조회 성공', data };
  }

  @Patch(':quizId')
  @HttpCode(HttpStatus.OK)
  async updateQuizHandler(
    @Param() path: UpdateQuizPathParam,
    @Auth('profileId') parentProfileId: number,
    @Body() body: UpdateQuizRequestDto,
  ): Promise<BaseResponse<UpdateQuizResponseData>> {
    const command = this.updateQuizMapper.toCommand(path.quizId, parentProfileId, body ?? {});
    const result = await this.updateQuiz.execute(command);
    const data = this.updateQuizMapper.toResponse(result);
    return { success: true, message: '수정이 완료되었습니다!', data };
  }

  @Delete(':quizId')
  @HttpCode(HttpStatus.OK)
  async deleteQuizHandler(
    @Param() path: DeleteQuizPathParam,
    @Auth('profileId') parentProfileId: number,
  ): Promise<BaseResponse<DeleteQuizResponseData>> {
    const command = this.deleteQuizMapper.toCommand(path.quizId, parentProfileId);
    const result = await this.deleteQuiz.execute(command);
    const data = this.deleteQuizMapper.toResponse(result);

    return { success: true, message: '삭제가 완료되었습니다!', data };
  }

  @Patch(':quizId/:childProfileId/reward')
  @HttpCode(HttpStatus.OK)
  async grantRewardHandler(
    @Param() path: ParentsGrantRewardPathParam,
    @Body() body: ParentsGrantRewardRequestDto,
  ): Promise<BaseResponse<ParentsGrantRewardResponseData>> {
    const command = this.parentsGrantRewardMapper.toCommand(path.quizId, path.childProfileId, body);
    const result = await this.grantReward.execute(command)
    const data = this.parentsGrantRewardMapper.toResponse(result);

    return { success: true, message: '보상 지급 처리 완료', data };
  }
}
