import { Injectable } from "@nestjs/common";
import { CreateQuizRequestDto } from "src/adapter/in/http/dto/request/parents-create-quiz-request.dto";
import { CreateQuizResponseData } from "pai-shared-types";
import { CreateQuizResponseResult } from "src/application/port/in/result/parents-create-quiz-result.dto";
import { ParentsCreateQuizCommand } from "src/application/command/parents-create-quiz.command";
import { Quiz } from "src/domain/model/quiz";
import { todayYmdKST } from "src/utils/date.util";

function isEditablePolicy(args: {
  publishDateYmd: string;
  authorParentProfileId: number;
  requestorParentProfileId: number;
  todayYmd: string;
}) {
  const { publishDateYmd, authorParentProfileId, requestorParentProfileId, todayYmd } = args;
  return authorParentProfileId === requestorParentProfileId && publishDateYmd >= todayYmd;
}

@Injectable()
export class CreateQuizMapper {
  toCommand(parentProfileId: number, dto: CreateQuizRequestDto): ParentsCreateQuizCommand {
    return new ParentsCreateQuizCommand(
      parentProfileId, 
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
  toResponseResult(quiz: Quiz, requestorParentProfileId: number): CreateQuizResponseResult {
    const today = todayYmdKST();
    const publishDateYmd = quiz.getPublishDate().ymd;
    const isEditable = isEditablePolicy({
      publishDateYmd,
      authorParentProfileId: quiz.getParentProfileId(),
      requestorParentProfileId,
      todayYmd: today,
    });

    return {
      quizId: quiz.getId()!,
      question: quiz.getQuestion(),
      answer: quiz.getAnswer(),
      hint: quiz.getHint(),
      reward: quiz.getReward(),
      publishDate: publishDateYmd,
      isEditable,
    };
  }

}
