import { Injectable } from "@nestjs/common";
import { CreateQuizRequestDto } from "src/adapter/in/http/dto/request/create-quiz.request.dto";
import { CreateQuizResponseData } from "pai-shared-types";
import { CreateQuizResponseResult } from "src/application/port/in/result/create-quiz.result.dto";
import { CreateQuizCommand } from "src/application/command/create-quiz.command";
import { Quiz } from "src/domain/model/quiz";
import { isEditable } from "src/domain/policy/quiz.policy";
import { todayYmd } from "src/utils/date.util";

@Injectable()
export class CreateQuizMapper {
  toCommand(parentProfileId: bigint, dto: CreateQuizRequestDto): CreateQuizCommand {
    return new CreateQuizCommand(
      parentProfileId,
      dto.question,
      dto.answer,
      dto.hint ?? null,
      dto.reward ?? null,
      dto.publishDate ?? null,
    );
  }

  // Controller용 - shared-types 사용
  toResponse(quiz: Quiz,): CreateQuizResponseData {
    const today = todayYmd();

    return {
      quizId: quiz.id!,
      question: quiz.question,
      answer: quiz.answer,
      hint: quiz.hint ?? null,
      reward: quiz.reward ?? null,
      publishDate: quiz.publishDate,
      isEditable: isEditable(
        quiz.publishDate,
        quiz.authorParentProfileId,
        quiz.authorParentProfileId,  // 자기 퀴즈이므로 작성자 = 조회자
        today
      ),
    };
  }

  // Service용 - Result DTO 사용
  toResponseResult(quiz: Quiz): CreateQuizResponseResult {
    const today = todayYmd();

    return {
      quizId: quiz.id!,
      question: quiz.question,
      answer: quiz.answer,
      hint: quiz.hint ?? null,
      reward: quiz.reward ?? null,
      publishDate: quiz.publishDate,
      isEditable: isEditable(
        quiz.publishDate,
        quiz.authorParentProfileId,
        quiz.authorParentProfileId,
        today
      ),
    };
  }

}
