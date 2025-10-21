import { Injectable } from "@nestjs/common";
import { ParentsQuizDetailResponseData } from "pai-shared-types";
import { ParentsQuizDetailResponseResult } from "src/adapter/in/http/dto/result/detail-quiz.result.dto";
import { DetailQuizCommand } from "src/application/command/detail-quiz.command";
import { Quiz } from "src/domain/model/quiz";
import { isEditable } from "src/domain/policy/quiz.policy";
import { todayYmd } from "src/utils/date.util";

@Injectable()
export class DetailQuizMapper {
  toCommand(quizId: number, parentProfileId: number): DetailQuizCommand {
    return new DetailQuizCommand(
      quizId,
      parentProfileId,
    );
  }

  // Controller용 - shared-types 사용
  toResponse(quiz: Quiz): ParentsQuizDetailResponseData {
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