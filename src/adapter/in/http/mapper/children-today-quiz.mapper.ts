import { Injectable } from "@nestjs/common";
import { ChildrenTodayQueryParam } from "src/adapter/in/http/dto/request/children-today-quiz-request.dto";
import type { ChildrenTodayResponseData } from "pai-shared-types";
import type { ChildrenTodayResponseResult } from "src/application/port/in/result/children-today-quiz-result.dto";
import { ChildrenTodayQuizCommand } from "src/application/command/children-today-quiz.command";

@Injectable()
export class ChildrenTodayMapper {
  toCommand(query: ChildrenTodayQueryParam, childProfileId: number): ChildrenTodayQuizCommand {
    return new ChildrenTodayQuizCommand(
      childProfileId,
      query.limit ?? 20,
      query.cursor
    );
  }

  toResponse(result: ChildrenTodayResponseResult): ChildrenTodayResponseData {
    return {
      items: result.items.map(item => ({
        quizId: item.quizId.toString(), // bigint -> string
        question: item.question,
        hint: item.hint,
        reward: item.reward,
        authorParentProfileId: item.authorParentProfileId,
        authorParentName: item.authorParentName,
        authorParentAvatarMediaId: item.authorParentAvatarMediaId?.toString() ?? null, // number | null -> string | null
        isSolved: item.isSolved,
        ...(item.answer && { answer: item.answer }), // isSolved일 때만 포함
      })),
      nextCursor: result.nextCursor ?? null,
      hasNext: result.hasNext,
    };
  }
}