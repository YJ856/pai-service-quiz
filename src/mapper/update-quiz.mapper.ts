import { Injectable } from "@nestjs/common";
import { UpdateQuizRequestDto } from "src/adapter/in/http/dto/update-quiz.request.dto";
import { UpdateQuizResponseData } from "pai-shared-types";
import { UpdateQuizCommand } from "src/application/command/update-quiz.command";
import { Quiz } from "src/domain/model/quiz";


const hasKey = <T extends object>(o: T, k: keyof any) =>
  o != null && Object.prototype.hasOwnProperty.call(o, k);

@Injectable()
export class UpdateQuizMapper {
  toCommand(quizId: number, parentProfileId: number, dto: UpdateQuizRequestDto): UpdateQuizCommand {
    const question    = hasKey(dto, 'question') ? dto.question : undefined;
    const answer      = hasKey(dto, 'answer')   ? dto.answer   : undefined;
    const hint        = hasKey(dto, 'hint')     ? (dto.hint ?? null) : undefined;
    const reward      = hasKey(dto, 'reward')   ? (dto.reward ?? null) : undefined;
    const publishDate = hasKey(dto, 'publishDate') ? (dto.publishDate ?? null) : undefined;

    return new UpdateQuizCommand(
      quizId,
      parentProfileId,
      question,
      answer,
      hint,
      reward,
      publishDate,
    );
  }

  toResponse(quiz: Quiz): UpdateQuizResponseData {
    const status = quiz.getStatus();
    const isEditable = status === 'SCHEDULED';

    return {
      quizId: quiz.id!,
      question: quiz.question,
      answer: quiz.answer,
      hint: quiz.hint ?? null,
      reward: quiz.reward ?? null,
      publishDate: quiz.publishDate,
      isEditable,
    };
  }
}