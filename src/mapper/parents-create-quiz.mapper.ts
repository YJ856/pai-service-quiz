import { Injectable } from "@nestjs/common";
import { CreateQuizRequestDto } from "src/adapter/in/http/dto/request/parents-create-quiz-request.dto";
import { CreateQuizResponseData } from "pai-shared-types";
import { CreateQuizResponseResult } from "src/application/port/in/result/create-quiz.result.dto";
import { ParentsCreateQuizCommand } from "src/application/command/parents-create-quiz.command";
import { Quiz } from "src/domain/model/quiz";
import { todayYmd } from "src/utils/date.util";

@Injectable()
export class CreateQuizMapper {
  toCommand(parentProfileId: number, dto: CreateQuizRequestDto): ParentsCreateQuizCommand {
    return new ParentsCreateQuizCommand(
      parentProfileId, // number -> bigint 변환
      dto.question,
      dto.answer,
      dto.hint ?? null,
      dto.reward ?? null,
      dto.publishDate ?? null,
    );
  }

  // Controller용 - Result를 shared-types로 변환
  toResponse(result: CreateQuizResponseResult): CreateQuizResponseData {
    return {
      quizId: result.quizId.toString(), // bigint -> string 변환
      question: result.question,
      answer: result.answer,
      hint: result.hint,
      reward: result.reward,
      publishDate: result.publishDate,
      isEditable: result.isEditable,
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
