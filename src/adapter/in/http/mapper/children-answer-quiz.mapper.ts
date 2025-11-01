import { Injectable } from "@nestjs/common";
import { AnswerQuizPathParam, AnswerQuizRequestDto } from "src/adapter/in/http/dto/request/children-answer-quiz-request.dto";
import type { AnswerQuizResponseData } from "pai-shared-types";
import type { AnswerQuizResponseResult } from "src/application/port/in/result/children-answer-quiz-result.dto";
import { ChildrenAnswerQuizCommand } from "src/application/command/children-answer-quiz.command";

@Injectable()
export class AnswerQuizMapper {
  toCommand(
    param: AnswerQuizPathParam,
    body: AnswerQuizRequestDto,
    childProfileId: number,
  ): ChildrenAnswerQuizCommand {
    return new ChildrenAnswerQuizCommand(
      BigInt(param.quizId), // -> bigint 변환
      childProfileId, 
      body.answer,
    );
  }

  // Controller용 - Result를 shared-types로 변환
  toResponse(result: AnswerQuizResponseResult): AnswerQuizResponseData {
    const base: AnswerQuizResponseData = {
      quizId: result.quizId.toString(), // -> string 변환
      isSolved: result.isSolved,
    };

    // 정답 맞췄을 때만 reward 공개
    if (result.isSolved && result.reward) {
      const reward = result.reward.trim();
      if (reward) return {...base, reward};
    }
    return base;
  }

  // Service용 - Result DTO 반환
  toResponseResult(data: {
    quizId: bigint;
    isSolved: boolean;
    reward?: string | null;
  }): AnswerQuizResponseResult {
    return {
      quizId: data.quizId,
      isSolved: data.isSolved,
      reward: data.reward ?? undefined,
    };
  }
}