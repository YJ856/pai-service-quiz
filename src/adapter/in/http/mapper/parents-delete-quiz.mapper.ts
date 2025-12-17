import { Injectable } from '@nestjs/common';
import { DeleteQuizResponseData } from 'pai-shared-types';
import { DeleteQuizResponseResult } from 'src/application/port/in/result/parents-delete-quiz-result.dto';
import { ParentsDeleteQuizCommand } from 'src/application/command/parents-delete-quiz.command';

@Injectable()
export class DeleteQuizMapper {
  toCommand(quizId: string, parentProfileId: number): ParentsDeleteQuizCommand {
    return new ParentsDeleteQuizCommand(
      parentProfileId, // number -> bigint 변환
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
