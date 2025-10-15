import { Injectable } from '@nestjs/common';
import type {
    CreateQuizRequestDto,
    CreateQuizResponseData,
    UpdateQuizRequestDto,
    UpdateQuizResponseData,
    DeleteQuizResponseData,
    AnswerQuizRequestDto,
} from 'pai-shared-types';
import type { CreateQuizCommand } from '../application/command/create-quiz.command';
import type { UpdateQuizCommand } from '../application/command/update-quiz.command';
import type { DeleteQuizCommand } from '../application/command/delete-quiz.command';
import type { AnswerQuizCommand } from '../application/port/in/answer-quiz.usecase';
import type { Quiz } from '../domain/model/quiz';
import { toYmdOrUndefined, toYmdFromDate } from '../utils/date.util';

/**
 * DTO(shared-type) <-> Command <-> Domain 변환 담당
 * - 외부 계약 변경의 파급을 여기서 흡수
 * - Controller/UseCase/Domain은 계약 변화로부터 보호됨
 * - 날짜: 'yyyy-MM-dd'는 **형식 유효성만 체크**하고 문자열 그대로 전달
 */
@Injectable()
export class QuizMapper {
    toCreateCommand(req: CreateQuizRequestDto, parentProfileId: string): CreateQuizCommand {
        const norm = (v: unknown) => (v == null ? null : String(v).trim());

        // 유효성 검사 후 문자열(yyyy-MM-dd) 그대로 사용
        const ymd = toYmdOrUndefined(req.publishDate ?? undefined);

        return {
            question: String(req.question ?? '').trim(),
            answer: String(req.answer ?? '').trim(),
            hint: norm(req.hint),
            reward: norm(req.reward),
            authorParentProfileId: parentProfileId,
            publishDate: ymd,
        };
    }

    toCreateResponse(saved: Quiz): CreateQuizResponseData {
        return { quizId: (saved as any).id as number };
    }

    toUpdateCommand(
        req: UpdateQuizRequestDto,
        quizId: number,
        parentProfileId: string,
    ): UpdateQuizCommand {
        return {
            quizId,
            parentProfileId,
            question: req.question !== undefined ? String(req.question).trim() : undefined,
            answer: req.answer !== undefined ? String(req.answer).trim() : undefined,
            hint: req.hint !== undefined ? (req.hint === null ? null : String(req.hint).trim()) : undefined,
            reward: req.reward !== undefined ? (req.reward === null ? null : String(req.reward).trim()) : undefined,
            publishDate: req.publishDate,
        };
    }

    toUpdateResponse(quiz: any): UpdateQuizResponseData {
        return {
            quizId: quiz.id,
            question: quiz.question,
            answer: quiz.answer,
            hint: quiz.hint ?? undefined,
            reward: quiz.reward ?? undefined,
            publishDate: toYmdFromDate(quiz.publishDate),
            isEditable: quiz.status === 'SCHEDULED',
        };
    }

    toDeleteCommand(
        quizId: number,
        parentProfileId: string,
    ): DeleteQuizCommand {
        return {
            quizId,
            parentProfileId: Number(parentProfileId),
        };
    }

    toDeleteResponse(quizId: number): DeleteQuizResponseData {
        return {
            quizId,
        };
    }

    /**
     * AnswerQuizRequestDto -> AnswerQuizCommand
     * - answer: trim 처리하여 빈 문자열 방지
     * - normalize: 기본값 false
     */
    toAnswerCommand(
        req: AnswerQuizRequestDto,
        quizId: number,
        childProfileId: string,
    ): AnswerQuizCommand {
        return {
            childProfileId,
            quizId,
            answer: String(req?.answer ?? '').trim(),
            normalize: req?.normalize ?? false,
        };
    }
}