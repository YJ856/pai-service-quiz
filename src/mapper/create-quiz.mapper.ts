import { Injectable } from "@nestjs/common";
import { CreateQuizRequestDto } from "src/adapter/in/http/dto/create-quiz.request.dto";
import { CreateQuizResponseData } from "pai-shared-types";
import { CreateQuizCommand } from "src/application/command/create-quiz.command";
import { Quiz } from "src/domain/model/quiz";

@Injectable()
export class CreateQuizMapper {
  toCommand(parentProfileId: number, dto: CreateQuizRequestDto): CreateQuizCommand {
    return new CreateQuizCommand(
      parentProfileId,
      dto.question,
      dto.answer,
      dto.hint ?? null,
      dto.reward ?? null,
      dto.publishDate ?? null,
    );
  }

  toResponse(quiz: Quiz): CreateQuizResponseData {
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
