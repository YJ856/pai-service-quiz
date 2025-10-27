import { Injectable } from "@nestjs/common";
import { UpdateQuizRequestDto } from "src/adapter/in/http/dto/request/parents-update-quiz-request.dto";
import { UpdateQuizResponseData } from "pai-shared-types";
import { UpdateQuizResponseResult } from "src/application/port/in/result/update-quiz.result.dto";
import { UpdateQuizCommand } from "src/application/command/update-quiz.command";
import { Quiz } from "src/domain/model/quiz";
import { isEditable } from "src/domain/policy/quiz.policy";
import { todayYmd } from "src/utils/date.util";


const hasKey = <T extends object>(o: T, k: keyof any) =>
  o != null && Object.prototype.hasOwnProperty.call(o, k);

@Injectable()
export class UpdateQuizMapper {
  toCommand(quizId: string, parentProfileId: number, dto: UpdateQuizRequestDto): UpdateQuizCommand {
    const question    = hasKey(dto, 'question') ? dto.question : undefined;
    const answer      = hasKey(dto, 'answer')   ? dto.answer   : undefined;
    const hint        = hasKey(dto, 'hint')     ? (dto.hint ?? null) : undefined;
    const reward      = hasKey(dto, 'reward')   ? (dto.reward ?? null) : undefined;
    const publishDate = hasKey(dto, 'publishDate') ? (dto.publishDate ?? null) : undefined;

    return new UpdateQuizCommand(
      BigInt(quizId), // string -> bigint 변환
      BigInt(parentProfileId), // number -> bigint 변환
      question,
      answer,
      hint,
      reward,
      publishDate,
    );
  }

  // Controller용 - Result를 shared-types로 변환
  toResponse(result: UpdateQuizResponseResult): UpdateQuizResponseData {
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
  toResponseResult(quiz: Quiz): UpdateQuizResponseResult {
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