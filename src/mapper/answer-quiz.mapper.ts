import { Injectable } from "@nestjs/common";
import { AnswerQuizPathParam, AnswerQuizRequestDto } from "src/adapter/in/http/dto/answer-quiz.request.dto";
import { AnswerQuizResponseData } from "pai-shared-types";
import { AnswerQuizCommand } from "src/application/command/answer-quiz.command";

@Injectable()
export class AnswerQuizMapper {
  toCommand(
    param: AnswerQuizPathParam,
    body: AnswerQuizRequestDto,
    childProfileId: number,
  ): AnswerQuizCommand {
    // 로컬 DTO에서 이미 trim/검증 끝났다면 굳이 String/trim은 재적용 안 해도 OK
    return new AnswerQuizCommand(
      param.quizId,
      childProfileId,
      body.answer,
    );
  }

  toResponse(result: {
    quizId: number;
    isSolved: boolean;
    reward?: string | null;
  }): AnswerQuizResponseData {
    const base: AnswerQuizResponseData = {
      quizId: result.quizId,
      isSolved: result.isSolved,
    };

    // 정답 맞췄을 때만 reward 공개
    if (result.isSolved) {
      const reward = (result.reward ?? '').toString().trim();
      if (reward) return {...base, reward};
    }
    return base;
  }
}