import { Injectable } from "@nestjs/common";
import { UpdateQuizRequestDto } from "src/adapter/in/http/dto/request/update-quiz.request.dto";
import { UpdateQuizResponseData } from "pai-shared-types";
import { UpdateQuizResponseResult } from "src/adapter/in/http/dto/result/update-quiz.result.dto";
import { UpdateQuizCommand } from "src/application/command/update-quiz.command";
import { Quiz } from "src/domain/model/quiz";
import { isEditable } from "src/domain/policy/quiz.policy";
import { todayYmd } from "src/utils/date.util";


const hasKey = <T extends object>(o: T, k: keyof any) =>
  o != null && Object.prototype.hasOwnProperty.call(o, k);

@Injectable()
export class UpdateQuizMapper {
  toCommand(quizId: number, parentProfileId: number, dto: UpdateQuizRequestDto): UpdateQuizCommand {
    const question    = hasKey(dto, 'question') ? dto.question : undefined;
    const answer      = hasKey(dto, 'answer')   ? dto.answer   : undefined;
    const hint        = hasKey(dto, 'hint')     ? (dto.hint ?? null) : undefined;
    const reward      = hasKey(dto, 'reward')   ? (dto.reward ?? null) : undefined;
    const publishDate = hasKey(dto, 'publishDate') ? (dto.publishDate ?? null) : undefined;

    return new UpdateQuizCommand(
      quizId,
      parentProfileId,
      question,
      answer,
      hint,
      reward,
      publishDate,
    );
  }

  // Controller용 - shared-types 사용
  toResponse(quiz: Quiz): UpdateQuizResponseData {
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