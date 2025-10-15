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


import { QuizMapper } from '../../../../mapper/quiz.mapper';
import { NextPublishDateMapper } from '../../../../mapper/next-publish-date.mapper';

import { ParentGuard } from '../auth/guards/parent.guard';
import { ChildGuard } from '../auth/guards/child.guard';
import { Auth } from '../decorators/auth.decorator';



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

    return { success: true, message: '오늘의 퀴즈 조회 성공', data };
  }

  @UseGuards(ParentGuard) 
  @Get('parents/completed')
  @HttpCode(HttpStatus.OK)
  async listParentsCompletedHandler(
    @Auth('profileId') parentProfileId: string,
    @Query() query: ParentsCompletedQueryDto,
  ): Promise<BaseResponse<ParentsCompletedResponseData>> {
    // limit 안전 파싱 + 클램프
    const rawLimit = (query as any)?.limit;
    let limit = 20; // 기본값
    if (rawLimit !== undefined) {
      const x = Number(rawLimit);
      if (Number.isFinite(x)) {
        limit = Math.max(1, Math.min(x, 50));
      }
    }

    // 빈 문자열 커서는 null 처리
    const cursor =
      query?.cursor && String(query.cursor).trim() !== ''
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
    // limit 안전 파싱 + 클램프
    const rawLimit = (query as any)?.limit;
    let limit = 20;
    if (rawLimit !== undefined) {
      const x = Number(rawLimit);
      if (Number.isFinite(x)) limit = Math.max(1, Math.min(x, 50));
    }

    // 빈 문자열 커서는 null 처리
    const cursor =
      query?.cursor && String(query.cursor).trim() !== ''
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
    // 숫자 파싱 + 검증 (잘못된 형식이면 400)
    const quizId = Number(quizIdParam);
    if (!Number.isFinite(quizId) || quizId <= 0) {
      // 컨트롤러에서 에러 throw 대신, 일관된 메시지를 원하면 BadRequestException 던져도 OK
      throw new Error('VALIDATION_ERROR');
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
    // Path 파싱
    const quizId = Number(quizIdParam);
    if (!Number.isFinite(quizId) || quizId <= 0) {
      // 컨벤션: 서비스에서 BadRequestException을 던지게 할 수도 있지만,
      // 여기서도 빠르게 필터링 가능
      throw new Error('VALIDATION_ERROR');
    }

    // DTO를 Command로 변환
    const cmd = this.quizMapper.toUpdateCommand(body ?? {}, quizId, parentProfileId);

    // 유스케이스 실행 (에러는 필터에서 공통 처리)
    const updatedQuiz = await this.updateQuiz.execute(cmd);

    // 수정된 퀴즈를 Response DTO로 변환
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
    // Path 파싱
    const quizId = Number(quizIdParam);
    if (!Number.isFinite(quizId) || quizId <= 0) {
      throw new Error('VALIDATION_ERROR');
    }

    // DTO를 Command로 변환
    const cmd = this.quizMapper.toDeleteCommand(quizId, parentProfileId);

    // 유스케이스 실행 (에러는 필터에서 공통 처리)
    await this.deleteQuiz.execute(cmd);

    // 응답 DTO 생성
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
    // limit 안전 파싱 + 클램프(기본 20, 1..50)
    const rawLimit = (query as any)?.limit;
    let limit = 20;
    if (rawLimit !== undefined) {
      const x = Number(rawLimit);
      if (Number.isFinite(x)) limit = Math.max(1, Math.min(x, 50));
    }

    // 빈 문자열 커서는 null 처리
    const cursor =
      query?.cursor && String(query.cursor).trim() !== ''
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
    // limit 안전 파싱 + 클램프(기본 20, 1..50)
    const rawLimit = (query as any)?.limit;
    let limit = 20;
    if (rawLimit !== undefined) {
      const x = Number(rawLimit);
      if (Number.isFinite(x)) limit = Math.max(1, Math.min(x, 50));
    }

    // 빈 문자열 커서는 null 처리 (Base64("yyyy-MM-dd|quizId"))
    const cursor =
      query?.cursor && String(query.cursor).trim() !== ''
        ? String(query.cursor).trim()
        : null;

    const data = await this.listChildrenCompleted.execute({
      childProfileId,
      limit,
      cursor,
    });

    return { success: true, message: '자녀용 완료된 퀴즈 조회 성공', data };
  }

}
