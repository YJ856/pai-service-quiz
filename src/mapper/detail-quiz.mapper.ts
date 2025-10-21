import { Injectable } from "@nestjs/common";
import { ParentsQuizDetailResponseData } from "pai-shared-types";
import { DetailQuizCommand } from "src/application/command/detail-quiz.command";
import { Quiz } from "src/domain/model/quiz";

@Injectable()
export class DetailQuizMapper {
  toCommand(quizId: number, parentProfileId: number): DetailQuizCommand {
    return new DetailQuizCommand(
      quizId,
      parentProfileId,
    );
  }

  toResponse(quiz: Quiz): ParentsQuizDetailResponseData {
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