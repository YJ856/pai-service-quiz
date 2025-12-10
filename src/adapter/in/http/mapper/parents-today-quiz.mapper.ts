import { Injectable } from "@nestjs/common";
import { ParentsTodayQueryParam } from "src/adapter/in/http/dto/request/parents-today-quiz-request.dto";
import type { ParentsTodayResponseData } from "pai-shared-types";
import type { ParentsTodayResponseResult } from "src/application/port/in/result/parents-today-quiz-result.dto";
import { ParentsTodayQuizCommand } from "src/application/command/parents-today-quiz.command";

@Injectable()
export class ParentsTodayMapper {
  toCommand(query: ParentsTodayQueryParam, parentProfileId: number): ParentsTodayQuizCommand {
    return new ParentsTodayQuizCommand(
      parentProfileId,
      query.limit ?? 20,
      query.cursor,
    );
  }

  toResponse(result: ParentsTodayResponseResult): ParentsTodayResponseData {
    return {
      items: result.items.map(item => ({
        quizId: item.quizId.toString(), // bigint -> string
        question: item.question,
        answer: item.answer,
        hint: item.hint,
        reward: item.reward,
        authorParentProfileId: item.authorParentProfileId,
        authorParentName: item.authorParentName,
        authorParentAvatarMediaId: item.authorParentAvatarMediaId?.toString() ?? null, // bigint | null -> string | null
        children: item.children.map(child => ({
          childProfileId: child.childProfileId,
          childName: child.childName,
          childAvatarMediaId: child.childAvatarMediaId?.toString() ?? null, // bigint | null -> string | null
          isSolved: child.isSolved,
        })),
      })),
      nextCursor: result.nextCursor ?? null,
      hasNext: result.hasNext,
    };
  }
}