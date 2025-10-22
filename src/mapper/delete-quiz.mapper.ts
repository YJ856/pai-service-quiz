import { Injectable } from "@nestjs/common";
import { DeleteQuizResponseData } from "pai-shared-types";
import { DeleteQuizResponseResult } from "src/application/port/in/result/delete-quiz.result.dto";
import { DeleteQuizCommand } from "src/application/command/delete-quiz.command";

@Injectable()
export class DeleteQuizMapper {
  toCommand(quizId: string, parentProfileId: number): DeleteQuizCommand {
    return new DeleteQuizCommand(
      BigInt(parentProfileId), // number -> bigint 변환
      BigInt(quizId), // string -> bigint 변환
    );
  }

  // Controller용 - Result를 shared-types로 변환
  toResponse(result: DeleteQuizResponseResult): DeleteQuizResponseData {
    return {
      quizId: result.quizId.toString(), // bigint -> string 변환
    };
  }

  // Service용 - Result DTO 반환
  toResponseResult(quizId: bigint): DeleteQuizResponseResult {
    return {
      quizId,
    };
  }
}