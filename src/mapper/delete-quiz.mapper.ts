import { Injectable } from "@nestjs/common";
import { DeleteQuizResponseData } from "pai-shared-types";
import { DeleteQuizResponseResult } from "src/application/port/in/result/delete-quiz.result.dto";
import { DeleteQuizCommand } from "src/application/command/delete-quiz.command";

@Injectable()
export class DeleteQuizMapper {
  toCommand(quizId: number, parentProfileId: number): DeleteQuizCommand {
    return new DeleteQuizCommand(
      parentProfileId,
      quizId,
    );
  }

  // Controller용 - Result를 shared-types로 변환
  toResponse(result: DeleteQuizResponseResult): DeleteQuizResponseData {
    return {
      quizId: result.quizId,
    };
  }

  // Service용 - Result DTO 반환
  toResponseResult(quizId: number): DeleteQuizResponseResult {
    return {
      quizId,
    };
  }
}