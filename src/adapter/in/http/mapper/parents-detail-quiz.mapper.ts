import { Injectable } from "@nestjs/common";
import { ParentsQuizDetailResponseData } from "pai-shared-types";
import { ParentsQuizDetailResponseResult } from "src/application/port/in/result/parents-detail-quiz-result.dto";
import { ParentsDetailQuizCommand } from "src/application/command/parents-detail-quiz.command";
import { Quiz } from "src/domain/model/quiz";
import { todayYmd } from "src/utils/date.util";

@Injectable()
export class DetailQuizMapper {
  toCommand(quizId: string, parentProfileId: number): ParentsDetailQuizCommand {
    return new ParentsDetailQuizCommand(
      BigInt(quizId), // string -> bigint 변환
      parentProfileId, 
    );
  }

  // Controller용 - Result를 shared-types로 변환
  toResponse(result: ParentsQuizDetailResponseResult): ParentsQuizDetailResponseData {
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
  toResponseResult(quiz: Quiz): ParentsQuizDetailResponseResult {
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