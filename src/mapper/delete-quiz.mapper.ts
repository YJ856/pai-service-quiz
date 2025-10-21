import { Injectable } from "@nestjs/common";
import { DeleteQuizResponseData } from "pai-shared-types";
import { DeleteQuizCommand } from "src/application/command/delete-quiz.command";

@Injectable()
export class DeleteQuizMapper {
  toCommand(quizId: number, parentProfileId: number): DeleteQuizCommand {
    return new DeleteQuizCommand(
      parentProfileId,
      quizId,
    );
  }

  toResponse(quizId: number): DeleteQuizResponseData {
    return {
      quizId,
    };
  }
}