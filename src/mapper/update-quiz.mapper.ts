import { Injectable } from "@nestjs/common";
import { UpdateQuizPathParam } from "src/adapter/in/http/dto/update-quiz.request.dto";
import { UpdateQuizRequestDto } from "src/adapter/in/http/dto/update-quiz.request.dto";
import { UpdateQuizCommand } from "src/application/command/update-quiz.command";


const hasKey = <T extends object>(o: T, k: keyof any) =>
  o != null && Object.prototype.hasOwnProperty.call(o, k);

@Injectable()
export class UpdateQuizMapper {
  toCommand(quizId: string, parentProfileId: string, dto: UpdateQuizRequestDto): UpdateQuizCommand {
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
}