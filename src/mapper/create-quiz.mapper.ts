import { Injectable } from "@nestjs/common";
import { CreateQuizRequestDto } from "src/adapter/in/http/dto/create-quiz.request.dto";
import { CreateQuizCommand } from "src/application/command/create-quiz.command";

@Injectable()
export class CreateQuizMapper {
  toCommand(parentProfileId: string, dto: CreateQuizRequestDto): CreateQuizCommand {
    return new CreateQuizCommand(
      parentProfileId,
      dto.question,
      dto.answer,
      dto.hint ?? null,
      dto.reward ?? null,
      dto.publishDate ?? null,
    );
  }
}